import { getOrInitHook } from "./context";
import { argsChanged } from "./helpers";

export const useMemo = <T, K extends unknown[]>(fn: () => T, args: K): T => {
  const state = getOrInitHook(
    "memo",
    () => ({ type: "memo", current: fn(), args }),
  );

  if (argsChanged(state.args, args)) state.current = fn();

  return state.current;
};
