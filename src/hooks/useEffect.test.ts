import { setAdapter } from "../adapter";
import { createElement } from "../element";
import { reconcile, render } from "../reconciler";
import { testAdapter, TestFrame } from "../test/util/testAdapter";
import { useEffect } from "./useEffect";
import { useForceUpdate, useState } from "./useState";

setAdapter(testAdapter);

it("invokes effect on mount", () => {
  const fn = jest.fn();
  const TestComponent = () => {
    useEffect(fn);
    return createElement("frame", null);
  };
  const root = new TestFrame();
  render(createElement(TestComponent, null), root);

  expect(fn).toHaveBeenCalledTimes(1);
});

it("invokes effect only once", () => {
  const fn = jest.fn();
  let rerender!: () => void;
  const TestComponent = () => {
    rerender = useForceUpdate();
    useEffect(fn);
    return createElement("frame", null);
  };
  const root = new TestFrame();
  render(createElement(TestComponent, null), root);

  expect(fn).toHaveBeenCalledTimes(1);

  rerender();

  expect(fn).toHaveBeenCalledTimes(1);
});

it("invokes effect if args change", () => {
  const fn = jest.fn();
  let inc!: () => void;
  const TestComponent = () => {
    const [state, setState] = useState(0);
    inc = () => setState((s) => s + 1);
    useEffect(fn, [state]);
    return createElement("frame", null);
  };
  const root = new TestFrame();
  render(createElement(TestComponent, null), root);

  expect(fn).toHaveBeenCalledTimes(1);

  inc();
  jest.runAllTimers();

  expect(fn).toHaveBeenCalledTimes(2);
});

it("cleans up on each invocation", () => {
  const clean = jest.fn();
  const fn = jest.fn().mockImplementation(() => clean);
  let inc!: () => void;
  const TestComponent = () => {
    const [state, setState] = useState(0);
    inc = () => setState((s) => s + 1);
    useEffect(fn, [state]);
    return createElement("frame", null);
  };
  const root = new TestFrame();
  render(createElement(TestComponent, null), root);

  expect(fn).toHaveBeenCalledTimes(1);
  expect(clean).toHaveBeenCalledTimes(0);

  inc();
  jest.runAllTimers();

  expect(clean).toHaveBeenCalledTimes(1);
  expect(fn).toHaveBeenCalledTimes(2);
});

it("cleans up on unmount", () => {
  const clean = jest.fn();
  const fn = jest.fn().mockImplementation(() => clean);
  const TestComponent = () => {
    useEffect(fn);
    return createElement("frame", null);
  };
  const root = new TestFrame();
  const instance = reconcile(root, null, createElement(TestComponent, null));

  expect(fn).toHaveBeenCalledTimes(1);
  expect(clean).toHaveBeenCalledTimes(0);

  reconcile(root, instance, null);

  expect(clean).toHaveBeenCalledTimes(1);
  expect(fn).toHaveBeenCalledTimes(1);
});
