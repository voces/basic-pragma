import { hookContext, hookMap } from "./context";
import { argsChanged } from "./helpers";
import { MemoState } from "./types";

export const useMemo = <T, K extends unknown[]>(fn: () => T, args: K): T => {
  const index = hookContext.currentIndex++;
  const hooks = hookMap.get(hookContext.currentComponent);
  if (!hooks) {
    throw `Could not located hook map. Are you using hooks outside of the render path?`;
  }
  const state = (hooks[index] ??
    (hooks[index] = { type: "memo", current: fn(), args })) as MemoState<T, K>;

  if (state.type !== "memo") {
    throw `Expected a memo hook at index ${index}, got ${state.type}`;
  }

  if (argsChanged(state.args, args)) state.current = fn();

  return state.current;
};
