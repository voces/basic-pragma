import { Adapter, adapter } from "./adapter";
import {
  ComponentType,
  FunctionComponent as FunctionalComponentType,
} from "./Component";
import { Children, NodeProps, VNode } from "./element";
import { isLua, TEXT_ELEMENT } from "./utils/common";
import { Context } from "./createContext";
import { getLength } from "./utils/arrays";
import { hooks } from "./hooks/context";

/**
 * A fleshed out vdom, with pointers to instantiated components or frames.
 */
export interface Instance<T, P> {
  vnode: VNode<P>;
  childInstances: Instance<T, unknown>[];
  // FunctionComponents are dynamically converted into ClassComponents
  component?: ClassComponent<P> | undefined;
  hostFrame?: T;
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
    const component = instanceOfSameType.component;

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
        vnode.props.children,
      );

      // vnode for a compositional frame (class/functional component)
    } else if (component) {
      if (parentFrame) instanceOfSameType.hostFrame = parentFrame;
      component.props = vnode.props;
      contexts = updateContexts(contexts, component);

      try {
        hooks.beforeRender(component);
      } catch (err) {
        console.error(err);
        cleanupFrames(instance);
        throw err;
      }

      const children = component.render(vnode.props, contexts);

      try {
        instanceOfSameType.childInstances = reconcileChildren(
          instanceOfSameType,
          contexts,
          children,
        );
      } catch (err) {
        if (component.componentDidCatch) {
          component.componentDidCatch(err);
        } else throw err;
      }
    }

    instanceOfSameType.vnode = vnode;
    return instanceOfSameType;
  }
}

function cleanupFrames<T, P>(instance: Instance<T, P>) {
  if (instance.component) hooks.beforeUnmount(instance.component);

  if (instance.childInstances) {
    for (const child of instance.childInstances) {
      if (child != null) cleanupFrames(child);
    }
  }

  if (instance.hostFrame && !instance.component) {
    adapter.cleanupFrame(instance.hostFrame);
  }
}

const updateContexts = (
  contexts: Contexts,
  // deno-lint-ignore no-explicit-any
  component: ClassComponent<any>,
) => {
  const context = (component.constructor as ComponentClass).context;
  if (context != null) {
    contexts = {
      ...contexts,
      [context.id]: component as InstanceType<Context<unknown>["Provider"]>,
    };
  }
  return contexts;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === "object";

const isChild = (value: unknown): value is string | VNode<unknown> => {
  if (typeof value === "string") return true;

  if (!isRecord(value)) return false;

  if (
    typeof value.type !== "string" && typeof value.type !== "function" &&
    // In Lua, classes are tables with prototypes
    (isLua ? (!isRecord(value.type) || !isRecord(value.type.prototype)) : true)
  ) {
    return false;
  }

  if (!isRecord(value.props)) return false;

  return true;
};

// NOTE: this will fail on an infinite loop!
function* childIterator(children: unknown): Generator<VNode<unknown> | string> {
  if (!Array.isArray(children)) {
    if (isChild(children)) yield children;
    return;
  }

  const length = getLength(children);
  for (let i = 0; i < length; i++) {
    const itr = childIterator(children[i]);
    let cur = itr.next();
    while (!cur.done) {
      yield cur.value;
      cur = itr.next();
    }
  }
}

const createTextElement = (
  nodeValue: string,
) => ({ type: TEXT_ELEMENT, props: { nodeValue } });

const childrenAsNodes = (children: unknown): VNode<unknown>[] => {
  const arr: VNode<unknown>[] = [];

  const itr = childIterator(children);
  let cur = itr.next();
  while (!cur.done) {
    arr.push(
      typeof cur.value === "string" ? createTextElement(cur.value) : cur.value,
    );
    cur = itr.next();
  }

  return arr;
};

function reconcileChildren<T, P>(
  instance: Instance<T, P>,
  contexts: Contexts,
  children: unknown,
) {
  const hostFrame = instance.hostFrame;
  const childInstances = instance.childInstances;
  const newChildInstances: Instance<T, unknown>[] = [];
  const flatChildren = childrenAsNodes(children);

  const count = Math.max(childInstances.length, flatChildren.length);
  // TODO: add support for keys
  for (let i = 0; i < count; i++) {
    const childInstance = childInstances[i];
    const childNode = flatChildren[i];
    const newChildInstance = reconcile(
      hostFrame,
      childInstance,
      childNode,
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
    const frame = (adapter as Adapter<T>).createFrame(
      type as keyof JSX.IntrinsicElements,
      parentFrame,
      props,
    );
    const childNodes = childrenAsNodes(vnode.props.children);
    const childInstances = childNodes.map((child) =>
      instantiate(child, frame, contexts)
    );
    return {
      hostFrame: frame,
      vnode,
      childInstances,
    };
  } else {
    // Instantiate component vnode
    const instance: Instance<T, P> = {
      vnode,
      hostFrame: parentFrame,
      childInstances: [],
    };
    instance.component = createComponent(vnode, instance, contexts);
    contexts = updateContexts(contexts, instance.component);

    try {
      hooks.beforeRender(instance.component);
    } catch (err) {
      console.error(err);
    }

    const children = childrenAsNodes(
      instance.component.render(props, contexts),
    );
    try {
      instance.childInstances = children
        .map((child) => instantiate(child, parentFrame, contexts));
    } catch (err) {
      if (instance.component.componentDidCatch) {
        instance.component.componentDidCatch(err);
      } else throw err;
    }

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
  instance: Instance<T, P>,
  contexts: Contexts,
): ClassComponent<P, S, T> {
  const { type: ComponentType, props } = vnode;
  let constructor;
  if (typeof ComponentType === "string") {
    throw "Tried to createComponent() with string";
  } else if (isClass(ComponentType)) {
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
        render(props: NodeProps<P>, contexts: Contexts) {
          return renderFunc(props, contexts);
        }
      };
      functionalComponentClasses.set(
        renderFunc,
        constructor as ComponentClass<P>,
      );
    }
  }

  const component = new constructor(props);
  component.contexts = contexts;
  component.instance = instance;

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
    | InstanceType<Context<unknown>["Provider"]>
    | undefined;
};

export abstract class ClassComponent<P, S = unknown, T = unknown> {
  // deno-lint-ignore no-explicit-any
  declare static context?: Context<any>;

  state = {} as S;
  contexts: Contexts = {};
  declare componentWillUnmount?: () => void;
  declare componentDidCatch?: (error: unknown) => void;

  constructor(public props: NodeProps<P>) {}

  setState(partialState: Partial<S>): void {
    this.state = { ...this.state, ...partialState };
    const instance = instanceMap.get(this);
    if (instance) scheduleUpdate(instance);
  }

  set instance(instance: Instance<T, P>) {
    instanceMap.set(this, instance);
  }

  get instance() {
    return instanceMap.get(this)!;
  }

  abstract render(props: NodeProps<P>, contexts: Contexts): Children;
}

export type ComponentClass<
  P = unknown,
  S = unknown,
  T = unknown,
  E = unknown,
> = {
  new (props: NodeProps<P>): ClassComponent<P, S, T> & E;

  context?: Context<unknown>;
};

function updateInstance<T>(internalInstance: Instance<T, unknown>) {
  const vnode = internalInstance.vnode;
  reconcile(null, internalInstance, vnode);
}

export const flushUpdates = (): void => {
  const values = Array.from(scheduledUpdates.values());
  scheduledUpdates.clear();
  for (const instance of values) updateInstance(instance);
};

export const test = { functionalComponentClasses };
