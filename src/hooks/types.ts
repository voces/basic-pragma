/** @noSelfInFile **/

import { ClassComponent } from "../reconciler";

export interface ReducerState<S, A> {
	type: "reducer";
	reducer?: (this: void, prevState: S, action: A) => S;
	instance?: ClassComponent<unknown>;
	value?: [S, (action: A) => void];
}

export interface EffectHookState<I> {
	type: "effect";
	lastInputs?: I;
	cleanup?: void | (() => void);
}

export type HookState<S, A> = ReducerState<S, A> | EffectHookState<S>;
