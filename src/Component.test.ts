import { setAdapter } from "./adapter";
import { ClassComponent } from "./Component";
import { createElement, EmptyObject, VNode } from "./element";
import { reconcile } from "./reconciler";
import { testAdapter, TestFrame } from "./test/testAdapter";

const Root = ({ children }: { children: VNode<unknown>[] }) => children[0];

class TestClassComponent extends ClassComponent<EmptyObject> {
	state = { foo: "bar" };
	render() {
		return createElement("frame", { ...this.state, innerFrame: true });
	}
}

const setupComponent = <P>(props: P) =>
	reconcile(
		new TestFrame(),
		null,
		createElement(Root, {}, [[createElement(TestClassComponent, props)]]),
	);

setAdapter(testAdapter);

describe("state", () => {
	it("works", () => {
		const component = setupComponent({});
		const child = component.childInstance;
		const publicInstance = child?.publicInstance;

		expect(publicInstance).toBeTruthy();
		expect(publicInstance?.state).toEqual({ foo: "bar" });
		expect(child?.hostFrame.props).toEqual({
			foo: "bar",
			innerFrame: true,
		});

		publicInstance?.setState({ foo: "baz" });

		expect(publicInstance?.state).toEqual({ foo: "baz" });
		expect(child?.hostFrame.props).toEqual({
			foo: "baz",
			innerFrame: true,
		});
	});
});
