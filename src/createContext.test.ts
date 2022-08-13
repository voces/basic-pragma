import { setAdapter } from "./adapter";
import { createContext } from "./createContext";
import { createElement, VNode } from "./element";
import { useState } from "./hooks/useState";
import { reconcile, render } from "./reconciler";
import { testAdapter, TestFrame } from "./test/testAdapter";

setAdapter(testAdapter);

it("no provider uses default value", () => {
  const { Consumer } = createContext("foo");
  const fn = jest.fn();
  reconcile(
    new TestFrame(),
    null,
    createElement(Consumer, undefined, (v) => fn(v)),
  );

  expect(fn).toHaveBeenCalledWith("foo");
});

it("use provider's value", () => {
  const { Consumer, Provider } = createContext("foo");
  const fn = jest.fn();
  reconcile(
    new TestFrame(),
    null,
    createElement(
      Provider,
      { value: "bar" },
      createElement(Consumer, undefined, (v) => fn(v)),
    ),
  );

  expect(fn).toHaveBeenCalledWith("bar");
});

it("use provider's value, even if deep", () => {
  const { Consumer, Provider } = createContext("foo");
  const fn = jest.fn();
  reconcile(
    new TestFrame(),
    null,
    createElement(
      Provider,
      { value: "bar" },
      createElement(
        "moo",
        undefined,
        createElement(Consumer, undefined, (v) => fn(v)),
      ),
    ),
  );

  expect(fn).toHaveBeenCalledWith("bar");
});

it("use nearest provider", () => {
  const { Consumer, Provider } = createContext("foo");
  const fn = jest.fn();
  reconcile(
    new TestFrame(),
    null,
    createElement(
      Provider,
      { value: "bar" },
      createElement(Consumer, undefined, (v) => fn(v)),
      createElement(
        Provider,
        { value: "baz" },
        createElement(Consumer, undefined, (v) => fn(v)),
      ),
    ),
  );

  expect(fn).toHaveBeenCalledTimes(2);
  expect(fn).nthCalledWith(1, "bar");
  expect(fn).nthCalledWith(2, "baz");
});

it("updates when value changes", () => {
  const fn = jest.fn();
  const { Consumer, Provider } = createContext("foo");
  let exposedSetState!: (nextState: string) => void;
  const TestRoot = ({ children }: { children: VNode[] }) => {
    const [state, setState] = useState("bar");
    exposedSetState = setState;
    return createElement(Provider, { value: state }, children);
  };
  render(
    createElement(
      TestRoot,
      undefined,
      createElement(Consumer, undefined, (v) => fn(v)),
    ),
    new TestFrame(),
  );

  expect(fn).toHaveBeenCalledWith("bar");

  exposedSetState("baz");
  jest.runAllTimers();

  expect(fn).toHaveBeenCalledWith("baz");
});
