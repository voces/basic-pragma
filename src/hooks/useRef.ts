/** @noSelfInFile **/

import { hookContext, hookMap } from "./context";
import { HookState } from "./types";
import "./reconcilerHooks";

export const useRef = <T>(initial: T): { current: T } => {
	const index = hookContext.currentIndex++;
	const hooks = hookMap.get(hookContext.currentInstance)!;
	const oldState = hooks[index];
	const state = (oldState ??
		(hooks[index] = { type: "ref", current: initial })) as HookState<T>;

	if (state.type !== "ref")
		throw `Expected a effect hook at index ${index}, got ${state.type}`;

	// Ideally I'd use a setter/getter, but tstl doesn't support that
	Object.defineProperty(state, "type", { enumerable: false });
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	return (state as any) as { current: T };
};
