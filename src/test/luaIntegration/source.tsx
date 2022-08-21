/** @jsx createElement */

import {
  createContext,
  createElement,
  flushUpdates,
  render,
  setAdapter,
  useContext,
  useState,
} from "basic-pragma";

declare global {
  namespace JSX {
    interface IntrinsicElements {
      [key: string]: { [key: string]: unknown };
    }
  }
}

type Frame = {
  type: string;
  children?: Frame[];
  propHistory?: { [key: string]: unknown }[];
  [key: string]: unknown;
};

let needsFlush = false;

setAdapter<Frame, { [key: string]: unknown; onClick: () => void }>({
  createFrame: (
    type,
    parent,
    { children, ...props },
  ) => {
    const frame: Frame = {
      ...props,
      type: type as string,
    };
    if (parent) {
      if (!parent.children) parent.children = [];
      parent.children.push(frame);
    }
    return frame;
  },
  updateFrameProperties: (frame, _, { children: _children, ...nextProps }) => {
    if (!frame.propHistory) frame.propHistory = [];
    const { children: _children2, propHistory, ...prevProps } = frame;
    frame.propHistory.push(prevProps);
    Object.assign(frame, nextProps);
  },
  scheduleUpdate: () => {
    needsFlush = true;
  },
});

const MyContext = createContext(2);

const Child = ({ mult, onClick }: { mult: number; onClick: () => void }) => {
  const val = useContext(MyContext) * mult;
  return <frame val={val} onClick={onClick} />;
};

const App = () => {
  const ctx = useContext(MyContext) * 3;
  const [state, setState] = useState(ctx);
  const [incState] = useState(() => () => setState((s) => s + 1));

  return (
    <MyContext.Provider value={state * 5}>
      <Child mult={7} onClick={incState} />
    </MyContext.Provider>
  );
};

const root: Frame & { children: NonNullable<Frame["children"]> } = {
  type: "root",
  children: [],
};
render(<App />, root);

if (typeof root.children[0].onClick === "function") root.children[0].onClick();

while (needsFlush) {
  needsFlush = false;
  flushUpdates();
}

// @ts-ignore Targeting Lua, where this is nice
export = root;
