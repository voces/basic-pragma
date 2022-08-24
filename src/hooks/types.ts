import type { ClassComponent } from "../reconciler";

export interface ReducerState<S, A> {
  type: "reducer";
  reducer?: (this: void, prevState: S, action: A) => S;
  component?: ClassComponent<unknown>;
  value?: [S, (action: A) => void];
}

export interface EffectHookState<I> {
  type: "effect";
  lastInputs?: I;
  cleanup?: void | (() => void);
}

export interface RefState<T> {
  type: "ref";
  current: T;
}

export interface MemoState<T, U> {
  type: "memo";
  current: T;
  inputs: U;
}

export type HookState<S, A = unknown> =
  | ReducerState<S, A>
  | EffectHookState<S>
  | RefState<S>
  | MemoState<S, A>;
