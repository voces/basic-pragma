/** @noSelfInFile **/

import type { Children, EmptyObject, NodeProps } from "./element";
import type { ComponentClass, Contexts } from "./reconciler";

export type FunctionComponent<P = EmptyObject> = (
  props: NodeProps<P>,
  contexts: Contexts,
) => Children;

export type ComponentType<P> =
  | ComponentClass<P>
  | FunctionComponent<P>;
