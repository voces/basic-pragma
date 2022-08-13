/** @noSelfInFile **/

import { ComponentType } from "./Component";
import { TEXT_ELEMENT } from "./common";
import { compact, getLength } from "./utils/arrays";

export interface VNode<P> {
  type: string | ComponentType<P>;
  props: P & { children?: Children };
  key?: string | number;
}

// deno-lint-ignore no-explicit-any
export type Child = VNode<any> | string | boolean | null | undefined;

export type Children = (Child[] | Child)[];

export const isChild = (obj: Children | Child): obj is Child =>
  (typeof obj === "object" && obj != null && "type" in obj && "props" in obj) ||
  typeof obj === "boolean" ||
  typeof obj === "string";

// deno-lint-ignore no-explicit-any
type RenderableChildElement = VNode<any> | string;

// deno-lint-ignore no-explicit-any
export const processChildren = (children: Children): VNode<any>[] =>
  compact(compact(children).flat())
    .filter(
      (c): c is RenderableChildElement =>
        typeof c !== "boolean" &&
        // filters out empty objects which are left because Array.flat() is not correct
        (typeof c === "string" || !!c.type),
    )
    .map((
      c,
    ) => (typeof c === "string" ? createTextElement(c) : c));

const EMPTY_OBJECT = {};
export type EmptyObject = typeof EMPTY_OBJECT;

export function createElement<P>(
  type: string | ComponentType<P>,
  props?: P & { key?: string | number; children?: VNode<unknown>[] },
  ...children: Children
): VNode<P> {
  const { key = null, ...rest } = { ...props };
  const flattenedChildren = processChildren(
    children && getLength(children) > 0 ? children : [],
  );

  // deno-lint-ignore no-explicit-any
  if (flattenedChildren.length > 0) rest.children = flattenedChildren as any;
  else delete rest.children;

  // IDK why this is mad, prop is LocalP - key + children, which should work...
  // deno-lint-ignore no-explicit-any
  const vnode: VNode<P> = { type, props: rest } as any;

  // Only set key if not nullish
  if (key != null) vnode.key = key;

  return vnode;
}

function createTextElement(value: string): VNode<{ nodeValue: string }> {
  return createElement(TEXT_ELEMENT, { nodeValue: value });
}

export const Fragment = (
  { children }: { children?: Children },
): Children | null => children ?? null;
