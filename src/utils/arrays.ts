import { isLua } from "./common";

/**
 * (Lua-safe) Gets or sets the length of the array. This is a number one higher
 * than the highest index in the array.
 */
export const getLength = <T>(arr: T[]): number =>
  isLua
    ? Object.keys(arr).reduce((max, key) => {
      const keyAsNumber = parseInt(key);
      if (!Number.isNaN(keyAsNumber)) {
        return max > keyAsNumber ? max : keyAsNumber;
      }
      return max;
    }, 0)
    : arr.length;

/**
 * Removes nils from the array.
 */
export const compact = <T>(arr: (T | undefined | null)[]): T[] => {
  if (!isLua) {
    return arr.filter(<T>(v: T | undefined | null): v is T => v != null);
  }

  const length = getLength(arr);
  const newArr = [];
  for (let i = 0; i < length; i++) {
    const val = arr[i];
    if (val != null) newArr.push(val);
  }
  return newArr;
};

/**
 * (Lua-safe) Performs the specified action for each element in an array.
 */
export const forEach = <T>(
  arr: T[],
  fn: (element: T, index: number) => void,
): void => {
  if (!isLua) return arr.forEach((e, i) => fn(e, i));

  const length = getLength(arr);

  for (let i = 0; i < length; i++) fn(arr[i], i);
};

type Filter = {
  <A>(arr: A[], fn: (element: A, index: number) => boolean): A[];
  <A, B extends A>(
    arr: A[],
    fn: (element: A | B, index: number) => element is B,
  ): B[];
};

/**
 * (Lua-safe) Returns the elements of an array that meet the condition specified
 * in a callback function.
 */
export const filter = (<A, B extends A>(
  arr: A[],
  fn: (element: A, index: number) => element is B,
) => {
  if (!isLua) return arr.filter((e, i) => fn(e, i));

  const length = getLength(arr);
  const newArr: B[] = [];
  let n = 0;

  for (let i = 0; i < length; i++) {
    const v = arr[i];
    if (fn(v, i)) newArr[n++] = v;
  }

  return newArr;
}) as Filter;

/**
 * (Lua-safe) Calls a defined callback function on each element of an array, and
 * returns an array that contains the results.
 */
export const map = <A, B>(
  arr: A[],
  fn: (element: A, index: number) => B,
) => {
  if (!isLua) return arr.map((e, i) => fn(e, i));

  const length = getLength(arr);
  const newArr: B[] = [];

  for (let i = 0; i < length; i++) newArr[i] = fn(arr[i], i);

  return newArr;
};

/**
 * (Lua-safe) Adds all the elements of an array into a string, separated by the
 * specified separator string.
 */
export const join = <A>(arr: A[], separator = ",") => {
  if (!isLua) return arr.join(separator);

  const length = getLength(arr);
  const strs: string[] = [];

  for (let i = 0; i < length; i++) {
    strs.push((arr[i] as { toString: () => string }).toString());
    if (i < length - 1 && separator.length > 0) strs.push(separator);
  }

  return strs.join("");
};
