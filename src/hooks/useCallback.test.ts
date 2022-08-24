import { setAdapter } from "../adapter";
import { createElement } from "../element";
import { render } from "../reconciler";
import { testAdapter, TestFrame } from "../test/testAdapter";
import { useCallback } from "./useCallback";
import { useForceUpdate, useState } from "./useState";

setAdapter(testAdapter);

it("works", () => {
  let forceUpdate!: () => void;
  let setStateFn!: (value: number) => void;
  const TestComponent = () => {
    const [state, setState] = useState(1);
    forceUpdate = useForceUpdate();
    setStateFn = setState;
    const value = useCallback(() => {}, [state]);

    return createElement("frame", { value });
  };
  const root = new TestFrame();
  render(createElement(TestComponent, null), root);

  const currentCallback = root.children[0].props.value;
  forceUpdate();
  jest.runAllTimers();

  expect(root.children[0].props.value).toBe(currentCallback);

  setStateFn(2);
  jest.runAllTimers();

  expect(root.children[0].props.value).not.toBe(currentCallback);
});
