import { createElement, Fragment } from "./element";

describe("createElement", () => {
  it("empty", () => {
    expect(createElement("frame", null)).toEqual({
      type: "frame",
      props: {},
    });
  });

  it("with props", () => {
    expect(createElement("frame", { foo: "bar", baz: 7 })).toEqual({
      type: "frame",
      props: { foo: "bar", baz: 7 },
    });
  });

  it("nested", () => {
    expect(
      createElement("frame", { outer: true }, [
        createElement("frame", { inner: true }),
      ]),
    ).toEqual({
      type: "frame",
      props: {
        outer: true,
        children: [{ type: "frame", props: { inner: true } }],
      },
    });
  });

  it("non-Node children", () => {
    expect(createElement("frame", {}, "inner")).toEqual({
      type: "frame",
      props: { children: "inner" },
    });
  });

  it("array child", () => {
    expect(createElement("frame", {}, ["inner"])).toEqual({
      type: "frame",
      props: { children: ["inner"] },
    });
  });

  it("multiple children", () => {
    expect(createElement("frame", {}, "inner1", "inner2")).toEqual({
      type: "frame",
      props: { children: ["inner1", "inner2"] },
    });
  });
});

describe("Fragment", () => {
  it("works", () => {
    expect(
      createElement(
        Fragment,
        {},
        createElement("frame", { a: true }),
        createElement("frame", { b: true }),
      ),
    ).toEqual({
      type: Fragment,
      props: {
        children: [
          { type: "frame", props: { a: true } },
          { type: "frame", props: { b: true } },
        ],
      },
    });
  });
});
