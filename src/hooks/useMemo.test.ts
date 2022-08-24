import { setAdapter } from "../adapter";
import { createElement } from "../element";
import { render } from "../reconciler";
import { buildFrame } from "../test/builders";
import { testAdapter, TestFrame } from "../test/testAdapter";
import { useMemo } from "./useMemo";
import { useState } from "./useState";

setAdapter(testAdapter);

it("works", () => {
  let setStateFn!: (value: number) => void;
  const callback = jest.fn();
  const TestComponent = () => {
    const [state, setState] = useState(1);
    setStateFn = setState;
    const value = useMemo(() => {
      callback();
      return state * 2;
    }, [state]);

    return createElement("frame", { value });
  };
  const root = new TestFrame();
  render(createElement(TestComponent, null), root);

  expect(root.children[0]).toEqual(buildFrame({ value: 2 }));
  expect(callback).toHaveBeenCalledTimes(1);

  setStateFn(2);
  jest.runAllTimers();

  expect(root.children[0]).toEqual(buildFrame({ value: 4 }));
  expect(callback).toHaveBeenCalledTimes(2);
});
