import type { Children } from "./element";
import { useRef } from "./hooks/useRef";

export let i = 0;

export const createContext = <T>(defaultValue: T) => {
  const contextId = "__cC" + i++;

  const context = {
    _id: contextId,
    _defaultValue: defaultValue,

    Consumer: (
      props: { children: (contextValue: T) => Children },
      contextValue: T,
    ) => props.children(contextValue),

    Provider: (props: { value: T; children: Children }) => {
      const data = useRef<{ getChildContext?: unknown }>({}).current;

      if (!data.getChildContext) {
        let subs = [];
        let ctx: Record<string, typeof data> = {};
        ctx[contextId] = data;

        data.getChildContext = () => ctx;

        // this.shouldComponentUpdate = function (_props) {
        //   if (this.props.value !== _props.value) {
        //     // I think the forced value propagation here was only needed when `options.debounceRendering` was being bypassed:
        //     // https://github.com/preactjs/preact/commit/4d339fb803bea09e9f198abf38ca1bf8ea4b7771#diff-54682ce380935a717e41b8bfc54737f6R358
        //     // In those cases though, even with the value corrected, we're double-rendering all nodes.
        //     // It might be better to just tell folks not to use force-sync mode.
        //     // Currently, using `useContext()` in a class component will overwrite its `this.context` value.
        //     // subs.some(c => {
        //     // 	c.context = _props.value;
        //     // 	enqueueRender(c);
        //     // });

        //     // subs.some(c => {
        //     // 	c.context[contextId] = _props.value;
        //     // 	enqueueRender(c);
        //     // });
        //     subs.some(enqueueRender);
        //   }
        // };

        data.sub = (c) => {
          subs.push(c);
          let old = c.componentWillUnmount;
          c.componentWillUnmount = () => {
            subs.splice(subs.indexOf(c), 1);
            if (old) old.call(c);
          };
        };
      }

      return props.children;
    },
  };

  // Devtools needs access to the context object when it
  // encounters a Provider. This is necessary to support
  // setting `displayName` on the context object instead
  // of on the component itself. See:
  // https://reactjs.org/docs/context.html#contextdisplayname

  return (context.Provider._contextRef =
    context.Consumer.contextType =
      context);
};
