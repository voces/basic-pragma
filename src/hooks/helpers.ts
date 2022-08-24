export type Inputs = ReadonlyArray<unknown>;

export const inputsChanged = (oldInputs: Inputs, newInputs: Inputs): boolean =>
  oldInputs.length !== newInputs.length ||
  newInputs.some((input, index) => input !== oldInputs[index]);
