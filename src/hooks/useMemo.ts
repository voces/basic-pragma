import { getOrInitHook } from "./context";
import { inputsChanged } from "./helpers";
import { MemoState } from "./types";
import "./reconcilerHooks";

export const useMemo = <T, K extends unknown[]>(fn: () => T, inputs: K): T => {
  const state = getOrInitHook(
    "memo",
    (): MemoState<T, K> => ({ type: "memo", current: fn(), inputs: inputs }),
  );

  if (inputsChanged(state.inputs, inputs)) state.current = fn();

  return state.current;
};
