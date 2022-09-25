import { setAdapter } from "./adapter";
import { TEXT_ELEMENT } from "./utils/common";
import { createElement, Fragment } from "./element";
import { ClassComponent, reconcile, render, test } from "./reconciler";
import { buildFrame, buildInstance, buildNode } from "./test/builders";
import { testAdapter, TestFrame } from "./test/testAdapter";

setAdapter(testAdapter);

describe("reconcile", () => {
  describe("creating an instance", () => {
    describe("intrinsics", () => {
      it("first child", () => {
        const root = new TestFrame();
        const vnode = createElement("frame", null);
        const instance = reconcile(root, null, vnode);

        expect(instance).toEqual({
          childInstances: [],
          hostFrame: {
            children: [],
            jsxType: "frame",
            props: {},
          },
          vnode,
        });
        expect(root.children).toEqual([instance.hostFrame]);
      });

      it("second child", () => {
        const root = new TestFrame();
        const firstChild = new TestFrame(undefined, root);
        const vnode = createElement("frame", null);
        const secondChild = reconcile(root, null, vnode);

        expect(secondChild).toEqual({
          childInstances: [],
          hostFrame: {
            children: [],
            jsxType: "frame",
            props: {},
          },
          vnode,
        });
        expect(root.children).toEqual([firstChild, secondChild.hostFrame]);
      });

      it("child with props", () => {
        const root = new TestFrame();
        const vnode = createElement("frame", { foo: "bar" });
        const instance = reconcile(root, null, vnode);

        expect(instance).toEqual({
          childInstances: [],
          hostFrame: {
            children: [],
            jsxType: "frame",
            props: { foo: "bar" },
          },
          vnode,
        });
        expect(root.children).toEqual([instance.hostFrame]);
      });

      it("nested children", () => {
        const root = new TestFrame();
        const fooNode = createElement("foo", null);
        const barNode = createElement("bar", null, fooNode);
        const instance = reconcile(root, null, barNode);
        const fooFrame = {
          children: [],
          jsxType: "foo",
          props: {},
        };

        expect(instance).toEqual({
          childInstances: [
            {
              childInstances: [],
              hostFrame: fooFrame,
              vnode: fooNode,
            },
          ],
          hostFrame: {
            children: [fooFrame],
            jsxType: "bar",
            props: { children: fooNode },
          },
          vnode: barNode,
        });
        expect(root.children.length).toEqual(1);
      });

      it("multiple children", () => {
        const instance = reconcile(
          new TestFrame(),
          null,
          createElement(
            "frame",
            null,
            createElement("frame", { a: true }),
            createElement("frame", { b: true }),
          ),
        );

        expect(instance).toEqual(buildInstance({
          children: [buildNode({ a: true }), buildNode({ b: true })],
        }));
      });

      it("array children", () => {
        const instance = reconcile(
          new TestFrame(),
          null,
          createElement(
            "frame",
            null,
            [
              createElement("frame", { a: true }),
              createElement("frame", { b: true }),
            ],
          ),
        );

        expect(instance).toEqual(buildInstance({
          children: [buildNode({ a: true }), buildNode({ b: true })],
        }));
      });
    });

    it("Fragment", () => {
      const root = new TestFrame();
      const aVNode = createElement("frame", { a: true });
      const bVNode = createElement("frame", { b: true });
      const instance = reconcile(
        root,
        null,
        createElement(Fragment, {}, aVNode, bVNode),
      );

      expect(instance).toEqual(
        {
          ...buildInstance({
            children: [buildNode({ a: true }), buildNode({ b: true })],
          }, Fragment),
          hostFrame: root,
        },
      );
    });

    it("function components", () => {
      const MyFunctionComponent = (props: { foo: string }) =>
        createElement("frame", props);

      const root = new TestFrame();
      const instance = reconcile(
        root,
        null,
        createElement(MyFunctionComponent, { foo: "bar" }),
      );

      expect(instance).toEqual({
        ...buildInstance({ foo: "bar" }, MyFunctionComponent),
        childInstances: [buildInstance({ foo: "bar" })],
        hostFrame: root,
      });
    });

    it("class components", () => {
      class MyClassComponent extends ClassComponent<{ foo: string }> {
        render(props: { foo: string }) {
          return createElement("frame", props);
        }
      }

      const root = new TestFrame();
      const instance = reconcile(
        root,
        null,
        createElement(MyClassComponent, { foo: "bar" }),
      );

      expect(instance).toEqual({
        ...buildInstance({ foo: "bar" }, MyClassComponent),
        childInstances: [buildInstance({ foo: "bar" })],
        hostFrame: root,
      });
    });
  });

  describe("removing instances", () => {
    it("removing an instance", () => {
      const root = new TestFrame();
      const vnode = createElement("frame", null);
      const instance = reconcile(root, null, vnode);

      expect(root).toEqual(
        expect.objectContaining({ children: [instance.hostFrame] }),
      );

      reconcile(root, instance, null);

      expect(root).toEqual(expect.objectContaining({ children: [] }));
    });

    it("removing child instances", () => {
      const root = new TestFrame();
      const vnode = createElement("frame", {}, [
        createElement("frame", null),
        createElement("frame", null),
      ]);
      const instance = reconcile(root, null, vnode);

      expect(root).toEqual(
        expect.objectContaining({ children: [instance.hostFrame] }),
      );

      reconcile(root, instance, null);

      expect(root).toEqual(expect.objectContaining({ children: [] }));
    });

    it("removing a component does not touch the parent", () => {
      const root = new TestFrame();
      const MyComponent = () => null;
      const instance = reconcile(
        root,
        null,
        createElement("frame", null, createElement(MyComponent, null)),
      );

      expect(root.children).toHaveLength(1);

      reconcile(root, instance, createElement("frame", null));

      expect(root.children).toHaveLength(1);
    });
  });

  it("replacing an instance", () => {
    const root = new TestFrame();
    const oldChild = createElement("foo", null);
    const newChild = createElement("bar", null);
    const oldInstance = reconcile(root, null, oldChild);

    expect(root).toEqual(
      expect.objectContaining({ children: [oldInstance.hostFrame] }),
    );

    const newInstance = reconcile(root, oldInstance, newChild);

    expect(root).toEqual(
      expect.objectContaining({ children: [newInstance.hostFrame] }),
    );

    expect(oldInstance).not.toEqual(newInstance);
  });

  describe("updating an instance", () => {
    it("adding props to an instance with none", () => {
      const root = new TestFrame();
      const instance = reconcile(root, null, createElement("frame", null));

      expect(root).toEqual(
        expect.objectContaining({ children: [instance.hostFrame] }),
      );

      const newInstance = reconcile(
        root,
        instance,
        createElement("frame", { foo: "foo-1" }),
      );

      expect(newInstance).toEqual(instance);
      expect(instance.vnode.props).toEqual({ foo: "foo-1" });
    });

    it("adding, changing, and removing props", () => {
      const root = new TestFrame();
      const instance = reconcile(
        root,
        null,
        createElement("frame", {
          foo: "foo-1",
          bar: "bar-1",
        }),
      );

      expect(root).toEqual(
        expect.objectContaining({ children: [instance.hostFrame] }),
      );

      const newInstance = reconcile(
        root,
        instance,
        createElement("frame", { bar: "bar-2", baz: "baz-1" }),
      );

      expect(newInstance).toEqual(instance);
      expect(instance.vnode.props).toEqual({
        bar: "bar-2",
        baz: "baz-1",
      });
    });

    it("adding, changing, and removing grandchild props", () => {
      const root = new TestFrame();
      const instance = reconcile(
        root,
        null,
        createElement("frame", {}, [
          createElement("frame", { index: 0 }),
          createElement("frame", { index: 1 }),
        ]),
      );

      expect(root).toEqual(
        expect.objectContaining({ children: [instance.hostFrame] }),
      );

      const newInstance = reconcile(
        root,
        instance,
        createElement("frame", {}, [
          createElement("frame", { index: 1 }),
          createElement("frame", { index: 2 }),
        ]),
      );

      expect(newInstance).toEqual(instance);
      expect(instance.hostFrame?.children).toEqual([
        {
          children: [],
          jsxType: "frame",
          props: { index: 1 },
        },
        {
          children: [],
          jsxType: "frame",
          props: { index: 2 },
        },
      ]);
    });

    it("updating function components", () => {
      const MyFunctionComponent = (props: {
        foo?: string;
        bar: string;
        baz?: string;
      }) => createElement("frame", props);

      const root = new TestFrame();
      const instance = reconcile(
        root,
        null,
        createElement(MyFunctionComponent, {
          bar: "bar-1",
          foo: "foo-1",
        }),
      );

      expect(instance).toEqual({
        ...buildInstance({ bar: "bar-1", foo: "foo-1" }, MyFunctionComponent),
        childInstances: [buildInstance({ bar: "bar-1", foo: "foo-1" })],
        hostFrame: root,
      });

      const newInstance = reconcile(
        root,
        instance,
        createElement(MyFunctionComponent, {
          bar: "bar-2",
          baz: "baz-1",
        }),
      );

      expect(newInstance).toBe(instance);
      expect(instance.vnode.props).toEqual({
        bar: "bar-2",
        baz: "baz-1",
      });
      expect(instance.component?.props).toEqual(instance.vnode.props);
      expect(instance.childInstances[0].vnode.props).toEqual(
        instance.vnode.props,
      );
    });
  });

  it("memoizes function components", () => {
    const MyFunctionComponent = () => createElement("frame", { foo: "bar" });

    reconcile(new TestFrame(), null, createElement(MyFunctionComponent, null));
    const klass = test.functionalComponentClasses.get(MyFunctionComponent);

    expect(klass).not.toEqual(undefined);

    reconcile(new TestFrame(), null, createElement(MyFunctionComponent, null));

    expect(
      test.functionalComponentClasses.get(MyFunctionComponent),
    ).toEqual(klass);
  });
});

describe("render", () => {
  it("works", () => {
    const root = new TestFrame();
    render(createElement("frame", { foo: "bar" }), root);

    expect(root.children).toEqual([buildFrame({ foo: "bar" })]);
  });

  it("skips non-renderable children", () => {
    const root = new TestFrame();
    render(
      createElement(
        "frame",
        null,
        "foo",
        true,
        false,
        "bar",
        null,
        undefined,
        createElement("frame", { me: "too" }),
      ),
      root,
    );

    expect(root.children[0].children).toEqual([
      buildFrame({ nodeValue: "foo" }, TEXT_ELEMENT),
      buildFrame({ nodeValue: "bar" }, TEXT_ELEMENT),
      buildFrame({ me: "too" }),
    ]);
  });

  it("does not create a host on second render", () => {
    const root = new TestFrame();
    render(createElement("frame", { foo: "bar" }), root);
    const child = root.children[0];

    expect(child).toEqual(buildFrame({ foo: "bar" }));

    render(createElement("frame", { foo: "baz" }), root);

    expect(root.children.length).toEqual(1);
    expect(root.children[0]).toBe(child);
    expect(child).toEqual(buildFrame({ foo: "baz" }));
  });
});
