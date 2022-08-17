import { Adapter } from "../../adapter";
import { EmptyObject } from "../../element";
import { flushUpdates } from "../../reconciler";

declare global {
  namespace JSX {
    interface IntrinsicElements {
      // deno-lint-ignore no-explicit-any
      frame: Record<string, any> | null;
      // deno-lint-ignore no-explicit-any
      foo: Record<string, any> | null;
      // deno-lint-ignore no-explicit-any
      bar: Record<string, any> | null;
    }
  }
}

export class TestFrame<P = Record<string, unknown>> {
  props: Record<string, unknown>;
  children: TestFrame[] = [];
  parent?: TestFrame;
  readonly jsxType?: string;
  declare disposed?: true;

  constructor(props?: EmptyObject, parent?: TestFrame, jsxType?: string);
  constructor(props: P, parent?: TestFrame, jsxType?: string);
  constructor(props?: P, parent?: TestFrame, jsxType?: string) {
    this.props = { ...props };
    this.jsxType = jsxType;

    this.parent = parent;
    // Hide parent since it forms a circular reference
    Object["defineProperty"](this, "parent", {
      value: parent,
      enumerable: false,
    });

    parent?.children.push(this);
  }

  dispose(): void {
    if (this.parent) {
      const index = this.parent.children.indexOf(this);
      if (index >= 0) this.parent.children.splice(index, 1);
    }
    this.disposed = true;
    for (const child of this.children) child.dispose();
  }
}

let waiting = false;

export const testAdapter: Adapter<TestFrame, Record<string, unknown>> = {
  createFrame: <P = Record<string, unknown>>(
    jsxType: string,
    parentFrame: TestFrame<unknown> | undefined,
    props: P,
  ): TestFrame<P> => new TestFrame(props, parentFrame, jsxType),

  cleanupFrame: <P extends Record<string, unknown>>(
    frame: TestFrame<P>,
  ): void => frame.dispose(),

  updateFrameProperties: <P extends Record<string, unknown>>(
    frame: TestFrame<P>,
    prevProps: P,
    nextProps: P,
  ): void => {
    // Clear removed props
    for (const prop in prevProps) {
      if (!(prop in nextProps)) delete frame.props[prop];
    }

    // Add new props
    for (const prop in nextProps) {
      if (nextProps[prop] !== prevProps[prop]) {
        frame.props[prop] = nextProps[prop];
      }
    }
  },

  getParent: <P extends Record<string, unknown>>(
    frame: TestFrame<P>,
  ): TestFrame | undefined => frame.parent,

  scheduleUpdate: (): void => {
    if (waiting) return;
    waiting = true;
    setImmediate(() => {
      waiting = false;
      flushUpdates();
    });
  },
};
