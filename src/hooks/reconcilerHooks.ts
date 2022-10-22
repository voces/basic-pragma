import { ClassComponent } from "../reconciler";
import { hookContext, hookMap, hooks } from "./context";

const oldBeforeRender = hooks.beforeRender;
const oldBeforeUnmount = hooks.beforeUnmount;

hooks.beforeRender = (component) => {
  oldBeforeRender(component);

  // TODO: somehow switch to a context/with pattern
  hookContext.currentComponent = component as ClassComponent<unknown>;
  hookContext.currentIndex = 0;

  if (!hookMap.has(component)) hookMap.set(component, []);
};

hooks.beforeUnmount = (component) => {
  oldBeforeUnmount(component);

  const hooks = hookMap.get(component);

  if (hooks) {
    hooks.forEach(
      (hook) => hook.type === "effect" && hook.cleanup && hook.cleanup(),
    );
  }
};
