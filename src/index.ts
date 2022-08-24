import { VNode } from "./element";

export { Adapter, setAdapter, withAdapter } from "./adapter";
export {
  Child,
  Children,
  createElement,
  EmptyObject,
  Fragment,
  VNode,
} from "./element";
export { flushUpdates, render } from "./reconciler";
export { FunctionComponent as FunctionalComponent } from "./Component";
export { createContext } from "./createContext";
export { isLua } from "./utils/common";
export { useContext } from "./hooks/useContext";
export { useEffect } from "./hooks/useEffect";
export { useForceUpdate, useState } from "./hooks/useState";
export { useMemo } from "./hooks/useMemo";
export { useReducer } from "./hooks/useReducer";
export { useRef } from "./hooks/useRef";

declare global {
  namespace JSX {
    // deno-lint-ignore no-empty-interface
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
