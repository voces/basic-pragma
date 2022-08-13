/** @noSelfInFile **/

import { FunctionalComponent } from "./Component";
import type { Child, VNode } from "./element";
import {
  ClassComponent,
  ComponentClass,
  Contexts,
  Instance,
  scheduleUpdate,
} from "./reconciler";

export let i = 0;

export type Context<T> = {
  id: number;
  // deno-lint-ignore no-explicit-any
  Consumer: FunctionalComponent<{ children: [(value: T) => VNode<any>] }>;
  Provider: ComponentClass<{ value: T }>;
  defaultValue: T;
};

export const createContext = <T>(defaultValue: T) => {
  const ctx = {
    id: i++,
    Consumer: (props, contexts) =>
      props.children[0](
        contexts[ctx.id] as T | undefined ?? defaultValue,
      ),
    defaultValue,
  } as Context<T>;

  class Provider extends ClassComponent<{ value: T }> {
    static context = ctx;
    subs = new Set<Instance<unknown, unknown>>();

    sub(instance: Instance<unknown, unknown>) {
      this.subs.add(instance);
      if (instance.component) {
        const oldComponentWillUnmount = instance.component.componentWillUnmount;
        instance.component.componentWillUnmount = () => {
          this.subs.delete(instance);
          instance.component!.componentWillUnmount = oldComponentWillUnmount;
          oldComponentWillUnmount();
        };
      }
    }

    render(
      { value, children }: { value: T; children?: Child[] },
      contexts: Contexts,
    ) {
      if (contexts[ctx.id] !== value) {
        contexts[ctx.id] = value;
        this.subs.forEach((instance) => scheduleUpdate(instance));
      }

      return children ?? null;
    }
  }

  ctx.Provider = Provider as ComponentClass<{ value: T }>;

  return ctx;
};
