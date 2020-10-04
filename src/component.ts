import { adapter } from "./adapter";
import { VNode } from "./element";
import { Instance, reconcile } from "./reconciler";

export abstract class ClassComponent<P, S = unknown, T = unknown> {
	state: S = {} as S;
	constructor(public props: P = {} as P) {}

	private __internalInstance!: Instance<T, P>;

	setState(partialState: Partial<S>): void {
		this.state = { ...this.state, ...partialState };
		updateInstance(this.__internalInstance);
	}

	abstract render(props: P): VNode<P> | null;
}

export type FunctionalComponent<P> = (props: P) => VNode<P> | null;

export type ComponentType<P> =
	| (new (props: P) => ClassComponent<P>)
	| FunctionalComponent<P>;

function updateInstance<T>(internalInstance: Instance<T, unknown>) {
	const parentDom = adapter.getParent(internalInstance.hostFrame);
	const vnode = internalInstance.vnode;
	if (parentDom) reconcile(parentDom, internalInstance, vnode);
	else throw "Tried to reconcile instance with no dom.parentDom";
}
