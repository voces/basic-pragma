import { setAdapter } from "./adapter";
import { createElement, EmptyObject } from "./element";
import { reconcile, ClassComponent } from "./reconciler";
import { testAdapter, TestFrame } from "./test/testAdapter";

class TestClassComponent extends ClassComponent<EmptyObject> {
	state = { foo: "bar" };
	render() {
		return createElement("frame", { ...this.state, innerFrame: true })!;
	}
}

const setupComponent = <P>(props: P) =>
	reconcile(new TestFrame(), null, createElement(TestClassComponent, props));

setAdapter(testAdapter);

describe("state", () => {
	it("works", () => {
		const component = setupComponent({});
		const publicInstance = component.component;

		expect(publicInstance).toBeTruthy();
		expect(publicInstance?.state).toEqual({ foo: "bar" });
		expect(component.childInstances[0]!.hostFrame!.props).toEqual({
			foo: "bar",
			innerFrame: true,
		});

		publicInstance?.setState({ foo: "baz" });
		jest.runAllTimers();

		expect(publicInstance?.state).toEqual({ foo: "baz" });
		expect(component.childInstances[0]!.hostFrame!.props).toEqual({
			foo: "baz",
			innerFrame: true,
		});
	});
});
