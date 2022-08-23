import { hookContext, hookMap } from "./context";
import { HookState } from "./types";
import "./reconcilerHooks";

const initializeRef = <T>(initial: T): HookState<T> => {
  const state: HookState<T> = { type: "ref", current: initial };

  // Ideally I'd use a setter/getter, but tstl doesn't support that
  Object.defineProperty(state, "type", { enumerable: false, value: "ref" });

  return state;
};

export const useRef = <T>(initial: T): { current: T } => {
  const index = hookContext.currentIndex++;
  const hooks = hookMap.get(hookContext.currentComponent);
  if (!hooks) {
    throw `Could not located hook map. Are you using hooks outside of the render path?`;
  }
  const state = (hooks[index] ??
    (hooks[index] = initializeRef(initial))) as HookState<T>;

  if (state.type !== "ref") {
    throw `Expected a ref hook at index ${index}, got ${state.type}`;
  }

  return state;
};
