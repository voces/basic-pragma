import { getOrInitHook } from "./context";
import { Inputs, inputsChanged } from "./helpers";
import { EffectHookState } from "./types";
import "./reconcilerHooks";

/**
 * Accepts a function that contains imperative, possibly effectful code.
 * Unlike React, the effects run synchronously if the inputs have changed.
 */
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
    (state.lastInputs && inputs && inputsChanged(state.lastInputs, inputs))
  ) {
    if (state.cleanup) state.cleanup();
    state.lastInputs = inputs;
    state.cleanup = callback();
  }
};
