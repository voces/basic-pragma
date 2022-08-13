/** @noSelfInFile **/

import { FunctionalComponent } from "./Component";
import type { Children, VNode } from "./element";
import {
  ClassComponent,
  ComponentClass,
  Contexts,
  Instance,
  scheduleUpdate,
} from "./reconciler";

export let i = 0;

export type Context<T = unknown> = {
  id: number;
  Consumer: FunctionalComponent<{ children: (value: T) => VNode<unknown> }>;
  Provider: ComponentClass<{ value: T }>;
  defaultValue: T;
};

export const createContext = <T>(defaultValue: T) => {
  const ctx = {
    id: i++,
    Consumer: (props, contexts) => props.children(contexts[ctx.id] as T),
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
      { value, children }: { value: T; children?: Children },
      contexts: Contexts,
    ) {
      if (contexts[ctx.id] !== value) {
        contexts[ctx.id] = value;
        this.subs.forEach((instance) => scheduleUpdate(instance));
      }

      return children;
    }
  }

  ctx.Provider = Provider;

  return ctx;
};
