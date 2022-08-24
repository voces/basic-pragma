import { getOrInitHook, hookContext } from "./context";
import { ReducerState } from "./types";
import "./reconcilerHooks";
import { scheduleUpdate } from "../reconciler";

export const useReducer = <S, A>(
  reducer: (prevState: S, action: A) => S,
  initialState: S,
): [S, (action: A) => void] => {
  const state = getOrInitHook(
    "reducer",
    (): ReducerState<S, A> => ({ type: "reducer" }),
  );

  state.reducer = reducer;

  if (!state.component) {
    state.value = [
      initialState,
      (action: A) => {
        const nextValue = state.reducer!(state.value![0], action);
        if (state.value![0] !== nextValue) {
          state.value = [nextValue, state.value![1]];
          scheduleUpdate(state.component!.instance);
        }
      },
    ];

    state.component = hookContext.currentComponent;
  }

  return state.value!;
};
