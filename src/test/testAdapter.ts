import { EmptyObject } from "../element";

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
		//
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		this.props = props ?? (({} as any) as P);
		this.jsxType = jsxType;

		// Hide parent since it forms a circular reference
		Object.defineProperty(this, "parent", {
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

	// We use setters and getters so we can mock them
	setProp<Prop extends keyof P>(prop: Prop, value: P[Prop]): void {
		this.props[prop] = value;
	}

	getProp(prop: string): unknown {
		return this.props[prop];
	}

	clearProp(prop: string): void {
		delete this.props[prop];
	}
}

export const testAdapter = {
	createFrame: <P extends Record<string, unknown>>(
		jsxType: string,
		parentFrame: TestFrame<P>,
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
			if (!(prop in nextProps)) frame.clearProp(prop);

		// Add new props
		for (const prop in nextProps)
			if (nextProps[prop] !== prevProps[prop])
				frame.setProp(prop, nextProps[prop]);
	},

	getParent: <P extends Record<string, unknown>>(
		frame: TestFrame<P>,
	): TestFrame | undefined => frame.parent,
};
