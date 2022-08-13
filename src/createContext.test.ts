import { setAdapter } from "./adapter";
import { createContext } from "./createContext";
import { createElement } from "./element";
import { reconcile } from "./reconciler";
import { testAdapter, TestFrame } from "./test/testAdapter";

setAdapter(testAdapter);

it("no provider uses default value", () => {
  const { Consumer } = createContext("foobar");
  const fn = jest.fn();
  reconcile(
    new TestFrame(),
    null,
    createElement(Consumer, undefined, (v) => fn(v)),
  );

  expect(fn).toHaveBeenCalledWith("foobar");
});

it("use provider's value", () => {
  const { Consumer, Provider } = createContext("foobar");
  const fn = jest.fn();
  reconcile(
    new TestFrame(),
    null,
    createElement(
      Provider,
      { value: "baz" },
      createElement(Consumer, undefined, (v) => fn(v)),
    ),
  );

  expect(fn).toHaveBeenCalledWith("baz");
});

it("use provider's value, even if deep", () => {
  const { Consumer, Provider } = createContext("foobar");
  const fn = jest.fn();
  reconcile(
    new TestFrame(),
    null,
    createElement(
      Provider,
      { value: "baz" },
      createElement(
        "moo",
        undefined,
        createElement(Consumer, undefined, (v) => fn(v)),
      ),
    ),
  );

  expect(fn).toHaveBeenCalledWith("baz");
});

it("use nearest provider", () => {
  const { Consumer, Provider } = createContext("foobar");
  const fn = jest.fn();
  reconcile(
    new TestFrame(),
    null,
    createElement(
      Provider,
      { value: "baz" },
      createElement(Consumer, undefined, (v) => fn(v)),
      createElement(
        Provider,
        { value: "buz" },
        createElement(Consumer, undefined, (v) => fn(v)),
      ),
    ),
  );

  expect(fn).toHaveBeenCalledTimes(2);
  expect(fn).nthCalledWith(1, "baz");
  expect(fn).nthCalledWith(2, "buz");
});
