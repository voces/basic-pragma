import { hookContext } from "./context";
import { useEffect } from "./useEffect";
import { useState } from "./useState";

export const useErrorBoundary = (callback?: (err: unknown) => void): [
  error: unknown | undefined,
  clearError: () => void,
] => {
  const [error, setError] = useState<unknown | undefined>(undefined);

  useEffect(() => {
    const component = hookContext.currentComponent;
    const oldComponentDidCatch = component.componentDidCatch;
    component.componentDidCatch = (err) => {
      setError(err);
      callback?.(err);
      oldComponentDidCatch?.(err);
    };
  }, []);

  return [error, () => setError(undefined)];
};
