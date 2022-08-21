import { setAdapter } from "../adapter";
import { createContext } from "../createContext";
import { Children, createElement } from "../element";
import { render } from "../reconciler";
import { testAdapter, TestFrame } from "../test/testAdapter";
import { useContext } from "./useContext";
import { useState } from "./useState";

setAdapter(testAdapter);

it("uses default if not set", () => {
  const fn = jest.fn();
  const context = createContext("foobar");
  const TestComponent = () => {
    fn(useContext(context));
    return null;
  };
  render(createElement(TestComponent, null), new TestFrame());

  expect(fn).toHaveBeenCalledWith("foobar");
});

it("inherits from provider", () => {
  const fn = jest.fn();
  const context = createContext("foobar");
  const TestComponent = () => {
    fn(useContext(context));
    return null;
  };
  render(
    createElement(
      context.Provider,
      { value: "buz" },
      createElement(TestComponent, null),
    ),
    new TestFrame(),
  );

  expect(fn).toHaveBeenCalledWith("buz");
});

it("updates when value updates", () => {
  const fn = jest.fn();
  const context = createContext("foo");
  let exposedSetState!: (nextState: string) => void;
  const TestRoot = ({ children }: { children?: Children }) => {
    const [state, setState] = useState("bar");
    exposedSetState = setState;
    return createElement(context.Provider, { value: state }, children);
  };
  const TestComponent = () => {
    fn(useContext(context));
    return null;
  };
  render(
    createElement(TestRoot, null, createElement(TestComponent, null)),
    new TestFrame(),
  );

  expect(fn).toHaveBeenCalledWith("bar");

  exposedSetState("baz");
  jest.runAllTimers();

  expect(fn).toHaveBeenCalledWith("baz");
});
