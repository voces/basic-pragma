/** @noSelfInFile **/

import { ClassComponent } from "../reconciler";
import { HookState } from "./types";

interface HookContext {
  currentInstance: ClassComponent<unknown>;
  currentIndex: number;
}

export const hookContext = {} as HookContext;

export const hookMap = new WeakMap<
  ClassComponent<unknown>,
  // deno-lint-ignore no-explicit-any
  HookState<any, unknown>[]
>();
