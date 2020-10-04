import { Component } from ".";
import { Adapter, adapter } from "./adapter";
import { ClassComponent, FunctionalComponent } from "./Component";
import { TEXT_ELEMENT, VNode } from "./element";

export interface Instance<T, P> {
	// FunctionComponents are dynamically converted into ClassComponents
	publicInstance?: ClassComponent<P> | undefined;
	childInstance: Instance<T, unknown> | null;
	childInstances: Array<Instance<T, unknown> | null>;
	hostFrame: T;
	vnode: VNode<P>;
}

let rootInstance: Instance<unknown, unknown> | null = null;

export function render<T, P extends Record<string, unknown>>(
	vnode: VNode<P>,
	container: T,
): void {
	const prevInstance = rootInstance;
	const nextInstance = reconcile(container, prevInstance, vnode);
	rootInstance = nextInstance;
}

export function reconcile<T, VNodeProps, InstanceProps>(
	parentFrame: T,
	instance: Instance<T, InstanceProps> | null,
	vnode: VNode<VNodeProps> | null,
): Instance<T, VNodeProps>;
export function reconcile<T, VNodeProps>(
	parentFrame: T,
	instance: null,
	vnode: VNode<VNodeProps>,
): Instance<T, VNodeProps>;
export function reconcile<T, VNodeProps, instanceProps>(
	parentFrame: T,
	instance: Instance<T, instanceProps> | null,
	vnode: VNode<VNodeProps> | null,
): Instance<T, VNodeProps> | null {
	if (!instance)
		// Create instance
		return instantiate(vnode!, parentFrame);
	else if (!vnode) {
		// Remove instance
		cleanupFrames(instance);
		return null;
	} else if (instance.vnode.type !== vnode.type) {
		// Replace instance
		const newInstance = instantiate(vnode, parentFrame);
		cleanupFrames(instance);
		return newInstance;
	} else {
		// This assumes .type equality => Prop type equality
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const instanceOfSameType = (instance as any) as Instance<T, VNodeProps>;

		if (typeof vnode.type === "string") {
			// Update host vnode
			adapter.updateFrameProperties(
				instance.hostFrame,
				instance.vnode.props,
				vnode.props,
			);
			instance.childInstances = reconcileChildren(instance, vnode);
			instanceOfSameType.vnode = vnode;
			return instanceOfSameType;
		} else if (instanceOfSameType.publicInstance) {
			// Update composite instance
			instanceOfSameType.publicInstance.props = vnode.props;
			const childElement = instanceOfSameType.publicInstance.render(
				vnode.props,
			);
			const oldChildInstance = instanceOfSameType.childInstance;
			const childInstance = reconcile(
				parentFrame,
				oldChildInstance,
				childElement,
			);

			if (!childInstance) throw "Failed to update composite instance";
			instanceOfSameType.hostFrame = childInstance.hostFrame;
			instanceOfSameType.childInstance = childInstance;
			instanceOfSameType.vnode = vnode;
			return instanceOfSameType;
		} else throw "Reconciler catch all error";
	}
}

function cleanupFrames<T>(instance: Instance<T, unknown>) {
	// TODO: composite objects need special cleanup, this should be part of reconcile
	if (instance.childInstances)
		instance.childInstances.forEach(
			(child) => child && cleanupFrames(child),
		);

	if (instance.childInstance) cleanupFrames(instance.childInstance);

	adapter.cleanupFrame(instance.hostFrame);
}

function reconcileChildren<T, P>(
	instance: Instance<T, unknown>,
	vnode: VNode<P>,
) {
	const hostFrame = instance.hostFrame;
	const childInstances = instance.childInstances;
	const nextChildElements = vnode.props.children || [];
	const newChildInstances = [];
	const count = Math.max(childInstances.length, nextChildElements.length);
	for (let i = 0; i < count; i++) {
		const childInstance = childInstances[i];
		const childElement = nextChildElements[i];
		const newChildInstance = reconcile(
			hostFrame,
			childInstance,
			childElement,
		);
		newChildInstances.push(newChildInstance);
	}
	return newChildInstances.filter((instance) => instance != null);
}

function instantiate<T, P>(vnode: VNode<P>, parentFrame: T): Instance<T, P> {
	const { type, props } = vnode;

	if (typeof type === "string") {
		if (type === TEXT_ELEMENT) throw "Cannot create inline text, yet";

		// Instantiate host vnode
		const frame = (adapter as Adapter<T>).createFrame(
			type,
			parentFrame,
			props,
		);

		adapter.updateFrameProperties(frame, {}, props);

		const childElements = props.children || [];
		const childInstances = childElements.map((child) =>
			instantiate(child, frame),
		);

		const instance: Instance<T, P> = {
			hostFrame: frame,
			vnode,
			childInstances,
			childInstance: null,
		};
		return instance;
	} else {
		// print('instantiate', (type as any).name, stringify(props));
		// Instantiate component vnode
		const instance = {} as Instance<T, P>;
		const publicInstance = createPublicInstance(vnode, instance);
		const childElement = publicInstance.render(props);
		const childInstance = childElement
			? instantiate(childElement, parentFrame)
			: undefined;
		const hostFrame = childInstance?.hostFrame;

		const updateProps: Partial<Instance<T, P>> = {
			hostFrame,
			vnode,
			childInstance,
			publicInstance,
		};
		Object.assign(instance, updateProps);
		return instance;
	}
}

function createPublicInstance<T, P>(
	vnode: VNode<P>,
	internalInstance: Instance<T, P>,
): Component<P, unknown, T> {
	const { type: ComponentType, props } = vnode;

	if (typeof ComponentType === "string")
		throw "Tried createPublicInstance() with string";

	const constructor =
		ComponentType.prototype && "render" in ComponentType.prototype
			? // eslint-disable-next-line @typescript-eslint/no-explicit-any
			  ((ComponentType as any) as new (props: P) => Component<
					P,
					unknown,
					T
			  >)
			: class FComponent extends Component<P, unknown, T> {
					render(props: P) {
						return (ComponentType as FunctionalComponent<P>)(props);
					}
			  };

	const publicInstance = new constructor(props);

	Object.defineProperty(publicInstance, "__internalInstance", {
		value: internalInstance,
	});
	return publicInstance;
}
