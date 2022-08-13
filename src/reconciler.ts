/** @noSelfInFile **/

import { Adapter, adapter } from "./adapter";
import {
  ComponentType,
  FunctionalComponent as FunctionalComponentType,
} from "./Component";
import { Child, Children, isChild, processChildren, VNode } from "./element";
import { isLua } from "./common";
import { compact } from "./utils/arrays";
import { Context } from "./createContext";

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
      // deno-lint-ignore no-explicit-any
      const instanceOfSameType = (instance as any) as Instance<T, VNodeProps>;

      // vnode for a host frame
      if (typeof vnode.type === "string") {
        // Update host vnode
        adapter.updateFrameProperties(
          instance.hostFrame,
          instance.vnode.props,
          vnode.props,
        );

        instanceOfSameType.childInstances = reconcileChildren(
          instanceOfSameType,
          contexts,
          vnode.props.children ?? [],
        );

        // vnode for a compositional frame (class/functional component)
      } else if (instanceOfSameType.component) {
        instanceOfSameType.component.props = vnode.props;

        try {
          hooks.beforeRender(instanceOfSameType.component);
        } catch (err) {
          print(err);
          cleanupFrames(instance);
          throw err;
        }

        const rendered = instanceOfSameType.component.render(
          vnode.props,
          contexts,
        );

        const children = isChild(rendered)
          ? rendered ? [rendered] : []
          : rendered;

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

function reconcileChildren<T, P>(
  instance: Instance<T, P>,
  contexts: Contexts,
  children: Children,
) {
  const hostFrame = instance.hostFrame;
  const childInstances = instance.childInstances;
  const nextChildElements = processChildren(children || []);
  const newChildInstances: Instance<T, unknown>[] = [];
  const count = Math.max(childInstances.length, nextChildElements.length);
  // TODO: add support for keys
  for (let i = 0; i < count; i++) {
    const childInstance = childInstances[i];
    const childElement = nextChildElements[i];
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
    const frame = (adapter as Adapter<T>).createFrame(type, parentFrame, props);
    const childElements = processChildren(props.children || []);
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
    instance.component = createPublicInstance(vnode, instance, contexts);

    try {
      hooks.beforeRender(instance.component);
    } catch (err) {
      print(err);
    }

    const rendered = instance.component.render(props, contexts) ?? [];
    const childElements = isChild(rendered) ? [rendered] : rendered;

    instance.childInstances = compact(childElements)
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

function createPublicInstance<T, S, P>(
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

  if ("context" in constructor) {
    contexts = { ...contexts, [constructor.context!.id]: constructor.context };
  }

  const publicInstance = new constructor(props);
  publicInstance.contexts = contexts;
  publicInstance.instance = internalInstance;
  return publicInstance;
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

export type Contexts = { [contextId: number]: unknown };

export abstract class ClassComponent<P, S = unknown, T = unknown> {
  declare static context?: Context<unknown>;

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

  abstract render(props: P, contexts: Contexts): Children | Child;
}

export type ComponentClass<
  P = unknown,
  S = unknown,
  T = unknown,
  C = unknown,
> = {
  new (
    props: P & { children?: Children; key?: string | number },
  ): ClassComponent<P, S, T>;

  context?: Context<C>;
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
