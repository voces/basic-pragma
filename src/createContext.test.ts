import { setAdapter } from "./adapter";
import { createContext } from "./createContext";
import { Children, createElement } from "./element";
import { useState } from "./hooks/useState";
import { render } from "./reconciler";
import { testAdapter, TestFrame } from "./test/util/testAdapter";

setAdapter(testAdapter);

it("no provider uses default value", () => {
  const { Consumer } = createContext("foo");
  const fn = jest.fn();
  render(
    createElement(
      Consumer,
      {}, // TODO: null should be acceptable
      (v) => fn(v),
    ),
    new TestFrame(),
  );

  expect(fn).toHaveBeenCalledWith("foo");
});

it("use provider's value", () => {
  const { Consumer, Provider } = createContext("foo");
  const fn = jest.fn();
  render(
    createElement(
      Provider,
      { value: "bar" },
      createElement(Consumer, {}, (v) => fn(v)),
    ),
    new TestFrame(),
  );

  expect(fn).toHaveBeenCalledWith("bar");
});

it("use provider's value, even if deep", () => {
  const { Consumer, Provider } = createContext("foo");
  const fn = jest.fn();
  render(
    createElement(
      Provider,
      { value: "bar" },
      createElement(
        "frame",
        {},
        createElement(Consumer, {}, (v) => fn(v)),
      ),
    ),
    new TestFrame(),
  );

  expect(fn).toHaveBeenCalledWith("bar");
});

it("use nearest provider", () => {
  const { Consumer, Provider } = createContext("foo");
  const fn = jest.fn();
  render(
    createElement(
      Provider,
      { value: "bar" },
      createElement(Consumer, {}, (v) => fn(v)),
      createElement(
        Provider,
        { value: "baz" },
        createElement(Consumer, {}, (v) => fn(v)),
      ),
    ),
    new TestFrame(),
  );

  expect(fn).toHaveBeenCalledTimes(2);
  expect(fn).nthCalledWith(1, "bar");
  expect(fn).nthCalledWith(2, "baz");
});

it("updates when value changes", () => {
  const fn = jest.fn();
  const { Consumer, Provider } = createContext("foo");
  let exposedSetState!: (nextState: string) => void;
  // TODO: what about REQUIRED children?
  const TestRoot = ({ children }: { children?: Children }) => {
    const [state, setState] = useState("bar");
    exposedSetState = setState;
    return createElement(Provider, { value: state }, children);
  };
  render(
    createElement(
      TestRoot,
      {},
      createElement(Consumer, {}, (v) => fn(v)),
    ),
    new TestFrame(),
  );

  expect(fn).toHaveBeenCalledWith("bar");

  exposedSetState("baz");
  jest.runAllTimers();

  expect(fn).toHaveBeenCalledWith("baz");
});
