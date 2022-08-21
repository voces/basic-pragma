export type Adapter<T = unknown, P = unknown> = {
  createFrame: (
    jsxType: keyof JSX.IntrinsicElements,
    parentFrame: T | undefined,
    props: P,
  ) => T;
  cleanupFrame: (frame: T) => void;
  updateFrameProperties: (frame: T, prevProps: P, nextProps: P) => void;
  getParent: (frame: T) => T | undefined;
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

const baseGetParent: Adapter["getParent"] = () => {
  throw "Adapter has not implemented getParent";
};

const baseScheduleUpdate: Adapter["scheduleUpdate"] = () => {
  throw "Adapter has not implemented scheduleUdate";
};

// deno-lint-ignore no-explicit-any
const internalAdapter: Adapter<any, any> = {
  createFrame: baseCreateFrame,
  cleanupFrame: baseCleanupFrame,
  updateFrameProperties: baseUpdateFrameProperties,
  getParent: baseGetParent,
  scheduleUpdate: baseScheduleUpdate,
};

export const adapter = internalAdapter;

export const setAdapter = <T, P>(adapter: Partial<Adapter<T, P>>): void => {
  // We do this just to ensure we set all methods on internalAdapter
  internalAdapter.createFrame = adapter.createFrame ?? baseCreateFrame;
  internalAdapter.cleanupFrame = adapter.cleanupFrame ?? baseCleanupFrame;
  internalAdapter.getParent = adapter.getParent ?? baseGetParent;
  internalAdapter.updateFrameProperties = adapter.updateFrameProperties ??
    baseUpdateFrameProperties;
  internalAdapter.scheduleUpdate = adapter.scheduleUpdate ?? baseScheduleUpdate;
};
