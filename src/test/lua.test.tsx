import { inspect } from "util";
import { lauxlib, lua, lualib, to_luastring } from "fengari";
import * as tstl from "typescript-to-lua";

const absurd = (v: never) => {
  throw `Unexpected ${inspect(v, false, 2, true)}`;
};

const lauTableToJsObject = (table: LuaTable) => {
  const v: Record<string, unknown> = {};
  for (const { key, value } of table.strong.values()) {
    v[luaToJs(key) as string] = luaToJs(value);
  }
  return v;
};

const luaToJs = (value: TValue) => {
  if (value.type === 20) {
    return new TextDecoder().decode(value.value.realstring);
  }
  if (value.type === 5) return lauTableToJsObject(value.value);
  if (value.type === 19) return value.value;
  absurd(value);
};

const runLua = (code: string) => {
  const L = lauxlib.luaL_newstate();
  lualib.luaL_openlibs(L);
  lauxlib.luaL_requiref(L, to_luastring("idk"), () => 0, 1);
  lua.lua_pop(L, 1);
  const status = lauxlib.luaL_dostring(L, to_luastring(code));

  expect(status).toBe(lua.LUA_OK);

  const type = lua.lua_type(L, -1);

  switch (type) {
    case 4:
      return lua.lua_tojsstring(L, -1);
    case 5:
      return lauTableToJsObject(lua.lua_topointer(L, -1) as LuaTable);
    case 20:
      return lua.lua_tojsstring(L, -1);
    default:
      throw new Error(
        `Unknown return type ${type} : ${
          inspect(L.stack[L.top - 1], false, 2, true)
        }`,
      );
  }
};

it("works in lua", () => {
  const obj = runLua(`local React = require 'dist/index'
local createElement = React.createElement
local props = {}
props.foo = 'bar'
return createElement('frame', props, 'myText', createElement('frame'))`);

  expect(obj).toEqual({
    type: "frame",
    props: {
      foo: "bar",
      children: {
        1: "myText",
        2: { type: "frame", props: {} },
      },
    },
  });
});

it("works with tstl", () => {
  const ret = tstl.transpileString(
    `import { createElement } from "dist/index";

const foo = createElement(
  "frame",
  { foo: "bar" },
  "myText",
  createElement("frame"),
);

export = foo;`,
    { noImplicitSelf: true },
  );

  expect(ret.file?.lua).not.toBeUndefined();

  const obj = runLua(ret.file!.lua!);

  expect(obj).toEqual({
    type: "frame",
    props: {
      foo: "bar",
      children: {
        1: "myText",
        2: { type: "frame", props: {} },
      },
    },
  });
});

// Not possible to mark file as JSX with "transpileString"
it.skip("works with jsx", () => {
  const ret = tstl.transpileString(
    `import { createElement } from "dist/index";

const foo = <frame foo="bar">
    {"myText"}
    <frame/>
  </frame>

export = foo;`,
    { noImplicitSelf: true },
  );

  expect(ret.file?.lua).not.toBeUndefined();

  const obj = runLua(ret.file!.lua!);

  expect(obj).toEqual({
    type: "frame",
    props: {
      foo: "bar",
      children: {
        1: "myText",
        2: { type: "frame", props: {} },
      },
    },
  });
});
