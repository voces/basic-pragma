import type { Context } from "../createContext";
import { hookContext } from "./context";
import "./reconcilerHooks";

export const useContext = <T>(
  Context: Context<T>,
): T => {
  const context = hookContext.currentComponent.contexts[Context.id];

  context?.sub(hookContext.currentComponent.instance);

  return context?.props.value as T | undefined ??
    Context.defaultValue;
};
