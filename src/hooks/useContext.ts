import type { Context } from "../createContext";
import { hookContext } from "./context";
import "./reconcilerHooks";

export const useContext = <T>(
  Context: Context<T>,
): T => {
  const context = hookContext.currentInstance.contexts[Context.id];

  context?.sub(hookContext.currentInstance.instance);

  return context?.props.value as T | undefined ??
    Context.defaultValue;
};
