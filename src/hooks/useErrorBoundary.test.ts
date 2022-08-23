import { setAdapter, withAdapter } from "../adapter";
import { createElement } from "../element";
import { render } from "../reconciler";
import { buildFrame } from "../test/builders";
import { testAdapter, TestFrame } from "../test/testAdapter";
import { useErrorBoundary } from "./useErrorBoundary";
import { useState } from "./useState";

setAdapter(testAdapter);

let clear = () => {};

const ThrowChild = () => {
  if (1 < Math.random()) return null;
  throw new Error("foobar!");
};

const TestComponent = (
  { callback }: { callback?: (err: unknown) => void },
) => {
  const [error, clearError] = useErrorBoundary(callback);
  const [cleared, setCleared] = useState(false);

  clear = () => {
    setCleared(true);
    clearError();
  };

  if (error) return createElement("frame", { error });
  if (!cleared) return createElement(ThrowChild, null);
  // if (!cleared) throw new Error("foobar!");
  return createElement("frame", { cleared });
};

it("catches errors", () => {
  const root = new TestFrame();
  render(
    createElement<Parameters<typeof TestComponent>[0]>(TestComponent, {}),
    root,
  );
  jest.runAllTimers();

  expect(root.children).toEqual([buildFrame({ error: new Error("foobar!") })]);
});

it("error can be cleared", () => {
  const root = new TestFrame();
  render(
    createElement<Parameters<typeof TestComponent>[0]>(TestComponent, {}),
    root,
  );
  jest.runAllTimers();

  expect(root.children).toEqual([buildFrame({ error: new Error("foobar!") })]);

  clear();
  jest.runAllTimers();

  expect(root.children).toEqual([buildFrame({ cleared: true })]);
});

it("callback works", () => {
  const fn = jest.fn();
  const root = new TestFrame();
  render(createElement(TestComponent, { callback: fn }), root);
  jest.runAllTimers();

  expect(root.children).toEqual([buildFrame({ error: new Error("foobar!") })]);
  expect(fn).toHaveBeenCalledTimes(1);
  expect(fn).toHaveBeenCalledWith(new Error("foobar!"));
});
