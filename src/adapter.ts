export type Adapter<T = unknown, P = unknown> = {
	createFrame: (jsxType: string, parentFrame: T, props: P) => T;
	cleanupFrame: (frame: T) => void;
	updateFrameProperties: (frame: T, prevProps: P, nextProps: P) => void;
	getParent: (frame: T) => T | undefined;
};

const baseCreateFrame: Adapter["createFrame"] = () => {
	throw new Error("Adapter has not implemented createFrame");
};
const baseCleanupFrame: Adapter["cleanupFrame"] = () => {
	throw new Error("Adapter has not implemented cleanupFrame");
};
const baseUpdateFrameProperties: Adapter["updateFrameProperties"] = () => {
	throw new Error("Adapter has not implemented updateFrameProperties");
};
const baseGetParent: Adapter["getParent"] = () => {
	throw new Error("Adapter has not implemented getParent");
};

const internalAdapter: Adapter = {
	createFrame: baseCreateFrame,
	cleanupFrame: baseCleanupFrame,
	updateFrameProperties: baseUpdateFrameProperties,
	getParent: baseGetParent,
};

export const adapter = internalAdapter;

export const setAdapter = (adapter: Partial<Adapter>): void => {
	// We do this just to ensure we set all methods on intenralAdapter
	const newAdapter: Adapter = {
		createFrame: adapter.createFrame ?? baseCreateFrame,
		cleanupFrame: adapter.cleanupFrame ?? baseCleanupFrame,
		getParent: adapter.getParent ?? baseGetParent,
		updateFrameProperties:
			adapter.updateFrameProperties ?? baseUpdateFrameProperties,
	};

	Object.assign(internalAdapter, newAdapter);
};
