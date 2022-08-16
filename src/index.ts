/** @noSelfInFile **/

import { VNode } from "./element";

export { Adapter, setAdapter } from "./adapter";
export { Child, createElement, EmptyObject, Fragment, VNode } from "./element";
export { flushUpdates, render } from "./reconciler";
export { FunctionComponent as FunctionalComponent } from "./Component";
export { createContext } from "./createContext";
export { useReducer } from "./hooks/useReducer";
export { useForceUpdate, useState } from "./hooks/useState";
export { useEffect } from "./hooks/useEffect";
export { useRef } from "./hooks/useRef";
export { useContext } from "./hooks/useContext";

declare global {
  namespace JSX {
    interface IntrinsicElements {}

    interface ElementAttributesProperty {
      props: unknown;
    }

    interface ElementChildrenAttribute {
      children: unknown;
    }

    // TODO: this allows passing the wrong node type around...
    // deno-lint-ignore no-explicit-any
    type Element = VNode<any>;
  }
}
