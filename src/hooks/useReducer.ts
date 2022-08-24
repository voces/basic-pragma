import { getOrInitHook, hookContext } from "./context";
import { ReducerState } from "./types";
import "./reconcilerHooks";

export const useReducer = <S, A>(
  reducer: (prevState: S, action: A) => S,
  initialState: S,
): [S, (action: A) => void] => {
  const state = getOrInitHook(
    "reducer",
    (): ReducerState<S, A> => ({ type: "reducer" }),
  );

  state.reducer = reducer;

  if (!state.instance) {
    state.value = [
      initialState,
      (action: A) => {
        const nextValue = state.reducer!(state.value![0], action);
        if (state.value![0] !== nextValue) {
          state.value = [nextValue, state.value![1]];
          state.instance!.setState({});
        }
      },
    ];

    state.instance = hookContext.currentComponent;
  }

  return state.value!;
};
