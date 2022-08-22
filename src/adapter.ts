export type Adapter<T = unknown, P = unknown> = {
  createFrame: (
    jsxType: keyof JSX.IntrinsicElements,
    parentFrame: T | undefined,
    props: P,
  ) => T;
  cleanupFrame: (frame: T) => void;
  updateFrameProperties: (frame: T, prevProps: P, nextProps: P) => void;
  scheduleUpdate: () => void;
};

const baseCreateFrame: Adapter["createFrame"] = () => {
  throw "Adapter has not implemented createFrame";
};

const baseCleanupFrame: Adapter["cleanupFrame"] = () => {
  throw "Adapter has not implemented cleanupFrame";
};

const baseUpdateFrameProperties: Adapter["updateFrameProperties"] = () => {
  throw "Adapter has not implemented updateFrameProperties";
};

const baseScheduleUpdate: Adapter["scheduleUpdate"] = () => {
  throw "Adapter has not implemented scheduleUdate";
};

// deno-lint-ignore no-explicit-any
const internalAdapter: Adapter<any, any> = {
  createFrame: baseCreateFrame,
  cleanupFrame: baseCleanupFrame,
  updateFrameProperties: baseUpdateFrameProperties,
  scheduleUpdate: baseScheduleUpdate,
};

export const adapter = internalAdapter;

export const setAdapter = <T, P>(adapter: Partial<Adapter<T, P>>): void => {
  // We do this just to ensure we set all methods on internalAdapter
  internalAdapter.createFrame = adapter.createFrame ?? baseCreateFrame;
  internalAdapter.cleanupFrame = adapter.cleanupFrame ?? baseCleanupFrame;
  internalAdapter.updateFrameProperties = adapter.updateFrameProperties ??
    baseUpdateFrameProperties;
  internalAdapter.scheduleUpdate = adapter.scheduleUpdate ?? baseScheduleUpdate;
};

export const withAdapter = <T, P, U>(
  adapter: Partial<Adapter<T, P>>,
  fn: () => U,
): U => {
  const oldAdapter = { ...internalAdapter };

  setAdapter(adapter);

  try {
    const ret = fn();
    setAdapter(oldAdapter);
    return ret;
  } catch (err) {
    setAdapter(oldAdapter);
    throw err;
  }
};
