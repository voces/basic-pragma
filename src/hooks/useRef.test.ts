import { setAdapter } from "../adapter";
import { createElement } from "../element";
import { render } from "../reconciler";
import { testAdapter, TestFrame } from "../test/testAdapter";
import { useRef } from "./useRef";

setAdapter(testAdapter);

it("works", () => {
  let ref: { current: TestFrame | null };
  const TestComponent = () => {
    ref = useRef<TestFrame | null>(null);

    return createElement("frame", { ref });
  };
  const root = new TestFrame();
  render(createElement(TestComponent), root);

  expect(ref!).toEqual({ current: root.children[0] });
});
