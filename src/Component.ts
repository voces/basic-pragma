/** @noSelfInFile **/

import type { Child, Children } from "./element";
import type { ComponentClass, Contexts } from "./reconciler";

export type FunctionalComponent<P> = (
  // TODO: Do rewriting on children similar to createElement
  props: P & { children?: Child[]; key?: string | number },
  contexts: Contexts,
) => Children | Child;

export type ComponentType<P> =
  | ComponentClass<P>
  | FunctionalComponent<P>;
