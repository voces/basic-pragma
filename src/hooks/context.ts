import type { ClassComponent } from "../reconciler";
import { HookState } from "./types";

interface HookContext {
  currentInstance: ClassComponent<unknown>;
  currentIndex: number;
}

export const hookContext = {} as HookContext;

export const hookMap = new WeakMap<
  // deno-lint-ignore no-explicit-any
  ClassComponent<any>,
  // deno-lint-ignore no-explicit-any
  HookState<any, unknown>[]
>();

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
