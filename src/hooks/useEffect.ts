import { getOrInitHook } from "./context";
import { argsChanged, Inputs } from "./helpers";
import { EffectHookState } from "./types";
import "./reconcilerHooks";

export const useEffect = <I extends Inputs>(
  callback: () => void | (() => void),
  inputs?: I,
): void => {
  let isNew = false;
  const state = getOrInitHook("effect", (): EffectHookState<I> => {
    isNew = true;
    return { type: "effect" };
  });

  if (
    isNew ||
    (state.lastInputs && inputs && argsChanged(state.lastInputs, inputs))
  ) {
    if (state.cleanup) state.cleanup();
    state.lastInputs = inputs;
    state.cleanup = callback();
  }
};
