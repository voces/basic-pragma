import type { ClassComponent } from "../reconciler";
import { HookState } from "./types";

interface HookContext {
  currentComponent: ClassComponent<unknown>;
  currentIndex: number;
}

export const hookContext = {} as HookContext;

export const hookMap = new WeakMap<
  // deno-lint-ignore no-explicit-any
  ClassComponent<any>,
  // deno-lint-ignore no-explicit-any
  HookState<any, any>[]
>();

// deno-lint-ignore no-explicit-any
export const getOrInitHook = <T extends HookState<any, any>>(
  type: T["type"],
  fn: () => T,
): T => {
  const index = hookContext.currentIndex++;
  const hooks = hookMap.get(hookContext.currentComponent);
  if (!hooks) {
    throw `Could not located hook map. Are you using hooks outside of the render path?`;
  }
  const state = hooks[index] ?? (hooks[index] = fn());
  if (state.type !== type) {
    throw `Expected a ${type} hook at index ${index}, got ${state.type}`;
  }
  return state as T;
};

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
