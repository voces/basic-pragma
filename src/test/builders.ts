import { VNode } from "../element";

export const buildFrame = (
  props: Record<string, unknown> = {},
  jsxType: unknown = "frame",
): Record<string, unknown> => ({
  children: Array.isArray(props.children)
    ? props.children.map((c: VNode) => buildFrame(c.props, c.type))
    : [],
  jsxType,
  props,
});

export const buildNode = (
  props: Record<string, unknown> = {},
  type: unknown = "frame",
) => ({ type, props });

export const buildInstance = (
  props: Record<string, unknown> = {},
  type: unknown = "frame",
): Record<string, unknown> => ({
  childInstances: Array.isArray(props.children)
    ? props.children.map((c: VNode) => buildInstance(c.props, c.type))
    : [],
  hostFrame: typeof type === "string" ? buildFrame(props, type) : undefined,
  component: typeof type === "function" ? buildComponent(props) : undefined,
  vnode: buildNode(props, type),
});

export const buildComponent = (
  props: unknown = {},
  state: unknown = {},
  contexts: unknown = {},
) => ({
  contexts,
  props,
  state,
});
