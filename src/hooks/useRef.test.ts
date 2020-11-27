import { setAdapter } from "../adapter";
import { createElement } from "../element";
import { reconcile } from "../reconciler";
import { testAdapter, TestFrame } from "../test/testAdapter";
import { useRef } from "./useRef";

setAdapter(testAdapter);

it("works", () => {
	let ref;
	const TestComponent = () => {
		ref = useRef<TestFrame | null>(null);

		return createElement("frame", { ref });
	};
	const instance = reconcile(
		new TestFrame(),
		null,
		createElement(TestComponent),
	);

	expect(ref).toEqual({ current: instance.childInstances[0].hostFrame });
});
