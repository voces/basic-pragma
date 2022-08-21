import { ComponentType } from "./Component";
import { getLength } from "./utils/arrays";

export type EmptyObject = Record<string, never>;

export type PropChildren<P> = P extends { children: (infer C)[] } ? C[]
  : P extends { children: infer C } ? C
  : Children;

export type NodeProps<P> =
  & Omit<P, "children">
  & ("children" extends keyof P ? { children: PropChildren<P> }
    : { children?: PropChildren<P> });

export interface VNode<P = EmptyObject> {
  type: string | ComponentType<P>;
  props: NodeProps<P>;
  key?: string | number;
}

export type Child =
  // deno-lint-ignore no-explicit-any
  | VNode<any>
  | string
  | boolean
  | null
  | undefined;

export type Children = Child | Children[];

// "children" should never be passed as a formal property. This type removes it.
// If the remaining type is empty, props must be either an empty object or null.
type InputProps<P> = keyof Omit<P, "children"> extends never
  ? (EmptyObject | null)
  : P extends { children: unknown } ? Omit<P, "children">
  : P;

type InputChildren<P> = P extends { children: (infer C)[] } ? C[]
  : P extends { children: infer C } ? [C]
  : Children[];

const processChildren = <P>(children: InputChildren<P>) =>
  (getLength(children) > 1
    ? children
    : getLength(children) === 1
    ? children[0]
    : Object.keys(children).length === 0
    ? undefined
    : children) as PropChildren<P>;

type CreateElement = {
  <P>(
    type: ComponentType<P>,
    props: InputProps<P>,
    ...children: InputChildren<P>
    // deno-lint-ignore no-explicit-any
  ): VNode<any>;
  <T extends keyof JSX.IntrinsicElements, P extends JSX.IntrinsicElements[T]>(
    type: T,
    props: InputProps<P>,
    ...children: InputChildren<P>
    // deno-lint-ignore no-explicit-any
  ): VNode<any>;
};

export const createElement: CreateElement = <
  P,
  T extends keyof JSX.IntrinsicElements | ComponentType<P>,
>(
  type: T,
  props: InputProps<
    T extends keyof JSX.IntrinsicElements ? JSX.IntrinsicElements[T] : P
  >,
  ...children: InputChildren<P>
  // deno-lint-ignore no-explicit-any
): VNode<any> => {
  const normalizedProps = {
    ...(props ?? {}),
    children: processChildren(children) as PropChildren<P>,
  } as NodeProps<P>;

  const vnode: VNode<P> = {
    type,
    props: normalizedProps,
  };

  return vnode;
};

export const Fragment = (
  { children }: { children?: Children },
) => children ?? null;
