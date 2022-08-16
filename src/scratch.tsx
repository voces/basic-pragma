type EmptyObject = Record<string, never>;

type PropChildren<P> = P extends { children: (infer C)[] } ? C[]
  : P extends { children: infer C } ? C
  : string;

export type NodeProps<P> =
  & Omit<P, "children">
  & { children?: PropChildren<P> };

type FC<P = EmptyObject> = (
  props: NodeProps<P>,
) => void;

type InputProps<P> = P extends Record<string, unknown>
  ? P[string] extends never ? (EmptyObject | null)
  : keyof Omit<P, "children"> extends never ? (EmptyObject | null)
  : P extends { children: unknown } ? Omit<P, "children">
  : P
  : (EmptyObject | null);

declare const createElement: <P>(
  type: FC<P>,
  props: InputProps<P>,
) => InputProps<P>;

const MyComponent = (props: { foo: string }) => {};
const v = createElement(MyComponent, { foo: "bar" });
