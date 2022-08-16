/** @noSelfInFile **/

import { FunctionComponent } from "./Component";
import { Child, Children, NodeProps } from "./element";
import {
  ClassComponent,
  ComponentClass,
  Instance,
  scheduleUpdate,
} from "./reconciler";

export let i = 0;

export type Context<T> = {
  id: number;
  Consumer: FunctionComponent<{ children: (value: T) => Children }>;
  Provider:
    & ComponentClass<
      { value: T },
      unknown,
      unknown,
      { sub: (instance: Instance<unknown, unknown>) => void }
    >
    & { context: Context<T> };
  defaultValue: T;
};

export const createContext = <T>(defaultValue: T) => {
  const ctx = {
    id: i++,
    Consumer: (props, contexts) =>
      props.children(
        contexts[ctx.id]?.props.value as T | undefined ?? defaultValue,
      ),
    defaultValue,
  } as Context<T>;

  class Provider extends ClassComponent<{ value: T }> {
    static context = ctx;
    subs = new Set<Instance<unknown, unknown>>();
    lastValue: T;

    constructor(props: NodeProps<{ value: T }>) {
      super(props);
      this.lastValue = props.value;
    }

    sub(instance: Instance<unknown, unknown>) {
      this.subs.add(instance);
      const component = instance.component;
      if (component) {
        const oldComponentWillUnmount = component.componentWillUnmount;
        component.componentWillUnmount = () => {
          this.subs.delete(instance);
          component.componentWillUnmount = oldComponentWillUnmount;
          oldComponentWillUnmount();
        };
      }
    }

    render({ value, children }: { value: T; children?: Child | Child[] }) {
      if (value !== this.lastValue) {
        this.lastValue = value;
        this.subs.forEach((instance) => scheduleUpdate(instance));
      }

      return children ?? null;
    }
  }

  ctx.Provider = Provider as Context<T>["Provider"];

  return ctx;
};
