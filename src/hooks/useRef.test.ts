import { setAdapter } from "../adapter";
import { createElement } from "../element";
import { render } from "../reconciler";
import { testAdapter, TestFrame } from "../test/util/testAdapter";
import { useRef } from "./useRef";
import { useForceUpdate } from "./useState";

setAdapter(testAdapter);

it("works", () => {
  const fn = jest.fn();
  let rerender!: () => void;
  let i = 0;
  const TestComponent = () => {
    rerender = useForceUpdate();
    i++;
    fn(useRef(i), i);

    return null;
  };
  const root = new TestFrame();
  render(createElement(TestComponent, null), root);
  rerender();
  jest.runAllTimers();

  expect(fn).toHaveBeenCalledTimes(2);
  expect(fn).toHaveBeenNthCalledWith(1, { current: 1 }, 1);
  expect(fn).toHaveBeenNthCalledWith(2, { current: 1 }, 2);
});
