import { useReducer } from "./useReducer";

export const useState = <S>(initialState: S): [S, (nextState: S) => void] =>
	useReducer((v) => v, initialState);
