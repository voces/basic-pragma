import { EmptyObject } from "../element";
import { flushUpdates } from "../reconciler";

export class TestFrame<P extends Record<string, unknown> = EmptyObject> {
	readonly type = "test-frame";
	props: P;
	children: TestFrame[] = [];
	parent?: TestFrame;
	readonly jsxType?: string;
	disposed?: true;

	constructor(props?: EmptyObject, parent?: TestFrame, jsxType?: string);
	constructor(props: P, parent?: TestFrame, jsxType?: string);
	constructor(props?: P, parent?: TestFrame, jsxType?: string) {
		// eslint-disable-next-line @typescript-eslint/no-this-alias
		const frame = this;
		this.props = Object.assign(
			({
				set ref(ref: { current: unknown }) {
					ref.current = frame;
				},
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
			} as any) as P,
			props,
		);
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

export const testAdapter = {
	createFrame: <P extends Record<string, unknown>>(
		jsxType: string,
		parentFrame: TestFrame<P> | undefined,
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
		for (const prop in prevProps)
			if (!(prop in nextProps)) delete frame.props[prop];

		// Add new props
		for (const prop in nextProps)
			if (nextProps[prop] !== prevProps[prop])
				frame.props[prop] = nextProps[prop];
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
