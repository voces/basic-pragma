/** @noSelfInFile **/

import { Child, Children } from "./element";
import { ClassComponent } from "./reconciler";

export type FunctionalComponent<P> = (props: P) => Children | Child;

export type ComponentType<P> =
	| (new (props: P) => ClassComponent<P>)
	| FunctionalComponent<P>;
