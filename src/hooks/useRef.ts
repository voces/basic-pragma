import { getOrInitHook } from "./context";
import { RefState } from "./types";
import "./reconcilerHooks";

const initializeRef = <T>(initial: T): RefState<T> => {
  const state: RefState<T> = { type: "ref", current: initial };

  // Ideally I'd use a setter/getter, but tstl doesn't support that
  Object.defineProperty(state, "type", { enumerable: false, value: "ref" });

  return state;
};

export const useRef = <T>(initial: T): { current: T } => {
  const state = getOrInitHook("ref", (): RefState<T> => initializeRef(initial));

  return state;
};
