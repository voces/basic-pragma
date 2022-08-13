/** @noSelfInFile **/

import { Adapter, adapter } from "./adapter";
import {
  ComponentType,
  FunctionalComponent as FunctionalComponentType,
} from "./Component";
import { Child, Children, processChildren, VNode } from "./element";
import { isLua } from "./common";
import { Context } from "./createContext";

declare global {
  // deno-lint-ignore no-var
  var print: typeof console.log;
}

globalThis.print = globalThis.print ?? console.log;

export const hooks = {
  // deno-lint-ignore no-unused-vars
  beforeRender: <T>(instance: ClassComponent<T>): void => {
    /* do nothing */
  },
  // deno-lint-ignore no-unused-vars
  beforeUnmount: <T>(instance: ClassComponent<T>): void => {
    /* do nothing */
  },
};

/**
 * A fleshed out vdom, with pointers to instantiated components or frames.
 */
export interface Instance<T, P> {
  // FunctionComponents are dynamically converted into ClassComponents
  component?: ClassComponent<P> | undefined;
  childInstances: Instance<T, unknown>[];
  hostFrame?: T;
  vnode: VNode<P>;
}

// deno-lint-ignore no-explicit-any
const containerMap = new WeakMap<any, Instance<any, any>>();

export function render<T, P>(vnode: VNode<P>, container: T): void {
  const prevInstance = containerMap.get(container) ?? null;
  const nextInstance = reconcile(container, prevInstance, vnode);
  containerMap.set(containerMap, nextInstance);
}

export function reconcile<T, InstanceProps>(
  parentFrame: T | undefined,
  instance: Instance<T, InstanceProps> | null,
  vnode: null,
  contexts?: Contexts,
): null;
export function reconcile<T, VNodeProps, InstanceProps>(
  parentFrame: T | undefined,
  instance: Instance<T, InstanceProps> | null,
  vnode: VNode<VNodeProps>,
  contexts?: Contexts,
): Instance<T, VNodeProps>;
export function reconcile<T, VNodeProps, instanceProps>(
  parentFrame: T | undefined,
  instance: Instance<T, instanceProps> | null,
  vnode: VNode<VNodeProps> | null,
  contexts: Contexts = instance?.component?.contexts ?? {},
): Instance<T, VNodeProps> | null {
  try {
    if (!instance) {
      // vnode is null if we're deleting something; we can't delete
      // something if there's no instance
      if (!vnode) return null;

      // Create instance
      return instantiate(vnode, parentFrame, contexts);
    } else if (!vnode) {
      // Remove instance
      cleanupFrames(instance);
      return null;
    } else if (instance.vnode.type !== vnode.type) {
      // Replace instance
      const newInstance = instantiate(vnode, parentFrame, contexts);
      cleanupFrames(instance);
      return newInstance;
    } else {
      // This assumes .type equality => Prop type equality
      const instanceOfSameType = instance as Instance<T, unknown> as Instance<
        T,
        VNodeProps
      >;

      // vnode for a host frame
      if (typeof vnode.type === "string") {
        // Update host vnode
        adapter.updateFrameProperties(
          instance.hostFrame,
          { ...instance.vnode.props, children: instance.vnode.children },
          { ...vnode.props, children: vnode.children },
        );

        instanceOfSameType.childInstances = reconcileChildren(
          instanceOfSameType,
          contexts,
          vnode.children ?? [],
        );

        // vnode for a compositional frame (class/functional component)
      } else if (instanceOfSameType.component) {
        instanceOfSameType.component.props = vnode.props;
        contexts = updateContexts(contexts, instanceOfSameType.component!);

        try {
          hooks.beforeRender(instanceOfSameType.component);
        } catch (err) {
          print(err);
          cleanupFrames(instance);
          throw err;
        }

        const children = processChildren(instanceOfSameType.component.render(
          { ...vnode.props, children: vnode.children },
          contexts,
        ));

        instanceOfSameType.childInstances = reconcileChildren(
          instanceOfSameType,
          contexts,
          children,
        );
      }

      instanceOfSameType.vnode = vnode;
      return instanceOfSameType;
    }
  } catch (err) {
    // TODO: log this error, but in a JavaScript/Lua general way...
    print(err);
    return null;
  }
}

function cleanupFrames<T, P>(instance: Instance<T, P>) {
  if (instance.component) hooks.beforeUnmount(instance.component);

  if (instance.childInstances) {
    for (const child of instance.childInstances) {
      if (child != null) cleanupFrames(child);
    }
  }

  if (instance.hostFrame) adapter.cleanupFrame(instance.hostFrame);
}

const updateContexts = (
  contexts: Contexts,
  // deno-lint-ignore no-explicit-any
  component: ClassComponent<any>,
) => {
  if ("context" in component.constructor) {
    const context = (component.constructor as ComponentClass).context!;
    contexts = {
      ...contexts,
      [context.id]: component as InstanceType<Context<unknown>["Provider"]>,
    };
  }
  return contexts;
};

function reconcileChildren<T, P>(
  instance: Instance<T, P>,
  contexts: Contexts,
  children: VNode<unknown>[],
) {
  const hostFrame = instance.hostFrame;
  const childInstances = instance.childInstances;
  const newChildInstances: Instance<T, unknown>[] = [];
  const count = Math.max(childInstances.length, children.length);
  // TODO: add support for keys
  for (let i = 0; i < count; i++) {
    const childInstance = childInstances[i];
    const childElement = children[i];
    // if (childInstance.component && "context" in childInstance.component)
    //   contexts[childInstance.component.context.id] =
    const newChildInstance = reconcile(
      hostFrame,
      childInstance,
      childElement,
      contexts,
    );
    if (newChildInstance != null) newChildInstances.push(newChildInstance);
  }
  return newChildInstances;
}

function instantiate<T, P>(
  vnode: VNode<P>,
  parentFrame: T | undefined,
  contexts: Contexts,
): Instance<T, P> {
  const { type, props } = vnode;

  if (typeof type === "string") {
    // Instantiate host vnode
    const frame = (adapter as Adapter<T>).createFrame(type, parentFrame, {
      ...props,
      children: vnode.children,
    });
    const childElements = processChildren(vnode.children || []);
    const childInstances = childElements.map((child) =>
      instantiate(child, frame, contexts)
    );
    return {
      hostFrame: frame,
      vnode,
      childInstances,
    };
  } else {
    // Instantiate component vnode
    const instance = { vnode } as Instance<T, P>;
    instance.component = createComponent(vnode, instance, contexts);
    contexts = updateContexts(contexts, instance.component);

    try {
      hooks.beforeRender(instance.component);
    } catch (err) {
      print(err);
    }

    const children = processChildren(
      instance.component.render(
        { ...props, children: vnode.children },
        contexts,
      ) ?? [],
    );

    instance.childInstances = children
      .filter((child): child is VNode<unknown> => typeof child === "object")
      .map((child) => instantiate(child, parentFrame, contexts));

    return instance;
  }
}

const functionalComponentClasses = new WeakMap<
  // deno-lint-ignore no-explicit-any
  FunctionalComponentType<any>,
  // deno-lint-ignore no-explicit-any
  ComponentClass<any>
>();

const isClass = <P>(constructor: ComponentType<P>) => {
  if (isLua) return typeof constructor !== "function";
  else return "prototype" in constructor;
};

function createComponent<T, S, P>(
  vnode: VNode<P>,
  internalInstance: Instance<T, P>,
  contexts: Contexts,
): ClassComponent<P, S, T> {
  const { type: ComponentType, props } = vnode;
  let constructor;
  if (typeof ComponentType === "string") {
    throw "Tried createPublicInstance() with string";
  } else if (isClass(ComponentType)) {
    // ComponentType.prototype && "render" in ComponentType.prototype)
    constructor = ComponentType as ComponentClass<P, S, T>;
  } else {
    const renderFunc = ComponentType as FunctionalComponentType<P>;
    const existingClass = functionalComponentClasses.get(renderFunc);
    if (existingClass) {
      constructor = existingClass as ComponentClass<P, S, T>;
    } else {
      // Wrap the dynamic class in an object to avoid all functional
      // components being ClassComponent
      constructor = class extends ClassComponent<P, S, T> {
        // get displayName() {
        // 	return renderFunc.name;
        // }
        render(props: P, contexts: Contexts) {
          return renderFunc(props, contexts);
        }
      };
      functionalComponentClasses.set(renderFunc, constructor);
    }
  }

  const component = new constructor({
    ...props,
    children: vnode.children,
  });
  component.contexts = contexts;
  component.instance = internalInstance;

  // if ("context" in constructor) {
  //   contexts = {
  //     ...contexts, // deno-lint-ignore no-explicit-any
  //     [constructor.context!.id]: component as any,
  //   };
  // }

  return component;
}

const instanceMap = new WeakMap<
  // deno-lint-ignore no-explicit-any
  ClassComponent<any>,
  // deno-lint-ignore no-explicit-any
  Instance<any, any>
>();

const scheduledUpdates = new Set<Instance<unknown, unknown>>();
export const scheduleUpdate = <T>(instance: Instance<T, unknown>) => {
  scheduledUpdates.add(instance);
  adapter.scheduleUpdate();
};

export type Contexts = {
  [contextId: number]:
    // deno-lint-ignore no-explicit-any
    | InstanceType<Context<any>["Provider"]>
    | undefined;
};

export abstract class ClassComponent<P, S = unknown, T = unknown> {
  // deno-lint-ignore no-explicit-any
  declare static context?: Context<any>;

  state = {} as S;
  contexts: Contexts = {};

  constructor(public props: P) {}

  componentWillUnmount() {}

  setState(partialState: Partial<S>): void {
    this.state = { ...this.state, ...partialState };
    const instance = instanceMap.get(this)!;
    if (instance) scheduleUpdate(instance);
  }

  set instance(instance: Instance<T, P>) {
    instanceMap.set(this, instance);
  }

  get instance() {
    return instanceMap.get(this)!;
  }

  abstract render(
    props: P & { children: Child[] | undefined },
    contexts: Contexts,
  ): Children | Child;
}

export type ComponentClass<
  P = unknown,
  S = unknown,
  T = unknown,
  E = unknown,
> = {
  new (
    props: P & { children?: Child[]; key?: string | number },
  ): ClassComponent<P, S, T> & E;

  context?: Context<unknown>;
};

function updateInstance<T>(internalInstance: Instance<T, unknown>) {
  const vnode = internalInstance.vnode;
  reconcile(null, internalInstance, vnode);
}

export const flushUpdates = (): void => {
  for (const instance of scheduledUpdates.values()) updateInstance(instance);
  scheduledUpdates.clear();
};

export const test = { functionalComponentClasses };
