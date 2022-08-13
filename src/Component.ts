/** @noSelfInFile **/

import type { Child, Children } from "./element";
import type { ComponentClass, Contexts } from "./reconciler";

export type FunctionalComponent<P> = (
  props: P & { children?: Children; key?: string | number },
  contexts: Contexts,
) => Children | Child;

export type ComponentType<P> =
  | ComponentClass<P>
  | FunctionalComponent<P>;
