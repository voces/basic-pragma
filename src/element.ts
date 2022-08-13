/** @noSelfInFile **/

import { ComponentType } from "./Component";
import { TEXT_ELEMENT } from "./common";
import { compact, getLength } from "./utils/arrays";

export interface VNode<P> {
  type: string | ComponentType<P>;
  props: P;
  key?: string | number;
  children: VNode<unknown>[] | undefined;
}

// deno-lint-ignore no-explicit-any
export type Child = VNode<any> | string | boolean | null | undefined;

export type Children = Child[] | Children[];

const isChild = (obj: Children | Child): obj is Child =>
  (typeof obj === "object" && obj != null && "type" in obj && "props" in obj) ||
  typeof obj === "boolean" ||
  typeof obj === "string";

// deno-lint-ignore no-explicit-any
type RenderableChildElement = VNode<any> | string;

// deno-lint-ignore no-explicit-any
export const processChildren = (children: Children | Child): VNode<any>[] =>
  compact((isChild(children) ? [children] : children).flat(10) as Child[])
    .filter(
      (c): c is RenderableChildElement =>
        typeof c !== "boolean" &&
        // filters out empty objects which are left because Array.flat() is not correct
        (typeof c === "string" || !!c.type || typeof c === "function"),
    )
    .map((
      c,
    ) => (typeof c === "string" ? createTextElement(c) : c));

const EMPTY_OBJECT = {};
export type EmptyObject = typeof EMPTY_OBJECT;

type PropChildren<P> = P extends { children: (infer C)[] } ? C[]
  : P extends { children: infer C } ? [C]
  : Children;

type Props<P> = Omit<P, "key" | "children"> & { key?: string | number };

export const createElement = <P, T extends string | ComponentType<P>>(
  ...[type, props, ...children]: T extends string ? [
      type: string,
      // These props refer to frame props, which should be set on JSX.Intrinsic
      props?: Props<Record<string, unknown>>,
      ...childrne: Children,
    ]
    : keyof Omit<P, "key" | "children"> extends never ? [
        type: string | ComponentType<P>,
        props?: Props<P>,
        ...children: PropChildren<P>,
      ]
    : [
      type: string | ComponentType<P>,
      props: Props<P>,
      ...children: PropChildren<P>,
    ]
): VNode<P> => {
  const { key, ...rest } = props ?? {};
  const processedChildren = children && getLength(children) > 0
    ? processChildren(children as Children[])
    : undefined;
  const finalChildren = processedChildren && getLength(processedChildren) > 0
    ? processedChildren
    : undefined;

  // IDK why this is mad, prop is LocalP - key + children, which should work...
  const vnode: VNode<P> = {
    type,
    props: rest as unknown as P,
    children: finalChildren,
  };

  // Only set key if not nullish
  if (key != null) vnode.key = key;

  return vnode;
};

function createTextElement(value: string): VNode<{ nodeValue: string }> {
  return createElement(TEXT_ELEMENT, { nodeValue: value });
}

export const Fragment = (
  { children }: { children?: Child[] },
): Child[] | null => children ?? null;
