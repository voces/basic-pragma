import { scheduleUpdate } from "../reconciler";
import { hookContext } from "./context";
import { useReducer } from "./useReducer";

export const useState = <S>(
  initialState: S | (() => S),
): [S, (nextState: S | ((oldState: S) => S)) => void] =>
  useReducer(
    (oldState, v) => {
      if (typeof v !== "function") return v;
      return (v as (oldState: S) => S)(oldState);
    },
    typeof initialState === "function"
      ? (initialState as () => S)()
      : initialState,
  );

export const useForceUpdate = (): () => void => {
  const instance = hookContext.currentComponent.instance;
  const update = () => scheduleUpdate(instance);
  return update;
};
