import { setAdapter } from "./adapter";
import { createElement, EmptyObject } from "./element";
import { ClassComponent, reconcile } from "./reconciler";
import { testAdapter, TestFrame } from "./test/util/testAdapter";

setAdapter(testAdapter);
class TestClassComponent extends ClassComponent<EmptyObject> {
  state = { foo: "bar" };
  render() {
    return createElement("frame", { ...this.state, innerFrame: true });
  }
}

describe("state", () => {
  it("works", () => {
    const instance = reconcile(
      new TestFrame(),
      null,
      createElement(TestClassComponent, {}),
    );
    const component = instance.component;

    expect(component).toBeTruthy();
    expect(component?.state).toEqual({ foo: "bar" });
    expect(instance.childInstances[0].hostFrame?.props).toEqual({
      foo: "bar",
      innerFrame: true,
    });

    component?.setState({ foo: "baz" });
    jest.runAllTimers();

    expect(component?.state).toEqual({ foo: "baz" });
    expect(instance.childInstances[0].hostFrame?.props).toEqual({
      foo: "baz",
      innerFrame: true,
    });
  });
});
