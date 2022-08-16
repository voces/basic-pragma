/** @jsx createElement */

import { createElement, render, setAdapter, VNode } from "../index";
import { buildFrame, buildNode } from "./util/builders";
import { testAdapter, TestFrame } from "./util/testAdapter";

setAdapter(testAdapter);

it("works", () => {
  const root = new TestFrame();
  render(
    <frame foo="bar">
      <frame bar={{ baz: "buz" }} />
    </frame>,
    root,
  );

  expect(root.children).toEqual([
    {
      ...buildFrame({
        foo: "bar",
        children: buildNode({ bar: { baz: "buz" } }),
      }),
      children: [buildFrame({ bar: { baz: "buz" } })],
    },
  ]);
});

it("works with custom components", () => {
  const MyComponent = (props: { foo: string }) => createElement("frame", props);

  expect(<MyComponent foo="bar" />).toEqual(
    buildNode({ foo: "bar" }, MyComponent),
  );
});

it("works with components whose children is a function", () => {
  const MyComponent = (_props: { children: () => string }) => <frame />;
  const fn = () => "foo";
  const node = <MyComponent>{fn}</MyComponent>;

  expect(node).toEqual(buildNode({ children: fn }, MyComponent));
});

it("works with components whose children is one specific node", () => {
  const ChildComponent = (_props: { foo: string }) => null;
  const MyComponent = (_props: { children: VNode<{ foo: "string" }> }) =>
    createElement("frame", null);

  expect(
    <MyComponent>
      <ChildComponent foo="foo" />
    </MyComponent>,
  ).toEqual(
    buildNode(
      { children: buildNode({ foo: "foo" }, ChildComponent) },
      MyComponent,
    ),
  );
});
