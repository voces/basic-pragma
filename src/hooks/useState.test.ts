import { setAdapter } from "../adapter";
import { createElement } from "../element";
import { render } from "../reconciler";
import { testAdapter, TestFrame } from "../test/testAdapter";
import { useState } from "./useState";

setAdapter(testAdapter);

it("works", () => {
	const fn = jest.fn();
	let exposedSetState!: (nextState: string) => void;
	const TestComponent = () => {
		const [state, setState] = useState("foo");
		exposedSetState = setState;
		fn(state);

		return createElement("frame", { knownState: state });
	};
	const root = new TestFrame();
	render(createElement(TestComponent), root);

	expect(fn).toHaveBeenCalledTimes(1);
	expect(fn).toHaveBeenCalledWith("foo");
	expect(root.children[0]).toMatchObject({
		jsxType: "frame",
		props: { knownState: "foo" },
	});

	exposedSetState("bar");
	jest.runAllTimers();

	expect(fn).toHaveBeenCalledTimes(2);
	expect(fn).toHaveBeenCalledWith("bar");
	expect(root.children[0]).toMatchObject({
		jsxType: "frame",
		props: { knownState: "bar" },
	});
});

it("does not thrash", () => {
	const fn = jest.fn();
	let exposedSetState!: (state1: string, state2: string) => void;
	const TestComponent = () => {
		const [state1, setState1] = useState("foo1");
		const [state2, setState2] = useState("foo2");
		exposedSetState = (state1, state2) => {
			setState1(state1);
			setState2(state2);
		};

		fn(state1 + state2);

		return createElement("frame");
	};
	const root = new TestFrame();
	render(createElement(TestComponent), root);

	expect(fn).toHaveBeenCalledTimes(1);
	expect(fn).toHaveBeenLastCalledWith("foo1foo2");

	exposedSetState("bar1", "bar2");
	jest.runAllTimers();

	expect(fn).toHaveBeenCalledTimes(2);
	expect(fn).toHaveBeenCalledWith("bar1bar2");
});

it("only rerenders self", () => {
	let childRenders = 0;
	let modifyChildState!: () => void;
	const ChildComponent = () => {
		const [, setState] = useState(0);
		modifyChildState = () => setState((s) => s + 1);
		childRenders++;

		return createElement("frame");
	};
	let parentRenders = 0;
	const ParentComponent = () => {
		parentRenders++;

		return createElement(ChildComponent);
	};

	render(createElement(ParentComponent), new TestFrame());

	expect(childRenders).toEqual(1);
	expect(parentRenders).toEqual(1);

	modifyChildState();
	jest.runAllTimers();

	expect(childRenders).toEqual(2);
	expect(parentRenders).toEqual(1);
});
