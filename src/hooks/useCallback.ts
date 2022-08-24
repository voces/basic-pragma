import { useMemo } from "./useMemo";

// deno-lint-ignore ban-types
export const useCallback = <T extends Function, K extends unknown[]>(
  callback: T,
  args: K,
): T => useMemo(() => callback, args);
