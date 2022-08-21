import { inspect } from "util";
import "./fengari";
import { lauxlib, lua, lualib, to_luastring } from "fengari";

const absurd = (v: never) => {
  throw new Error(`Unexpected ${inspect(v, false, 3, true)}`);
};

const lauTableToJsObject = (table: LuaTable) => {
  const values = Array.from(table.strong.values());
  const entries = values.map((v) => [luaToJs(v.key), luaToJs(v.value)]);

  if (entries.every((v) => typeof v[0] === "number")) {
    return entries.map((v) => v[1]);
  }

  return Object.fromEntries(entries);
};

const luaToJs = (value: TValue): unknown => {
  if (value.type === lua.LUA_TNUMBER || value.type === 19) return value.value;
  if (value.type === lua.LUA_TTABLE) return lauTableToJsObject(value.value);
  if (value.type === lua.LUA_TFUNCTION) {
    let name: unknown = "anonymous";
    try {
      name = luaToJs(value.value?.p?.k?.[0]);
      // deno-lint-ignore no-empty
    } catch {}
    return `[Function ${name}]`;
  }
  if (value.type === 20) {
    return new TextDecoder().decode(value.value.realstring);
  }
  absurd(value);
};

export const runLua = (code: string) => {
  const L = lauxlib.luaL_newstate();
  lualib.luaL_openlibs(L);
  lauxlib.luaL_requiref(L, to_luastring("idk"), () => 0, 1);
  lua.lua_pop(L, 1);
  const status = lauxlib.luaL_dostring(L, to_luastring(code));

  if (status !== lua.LUA_OK) {
    console.log(lua.lua_tojsstring(L, -1));
  }
  expect(status).toBe(lua.LUA_OK);

  const type = lua.lua_type(L, -1);

  switch (type) {
    case lua.LUA_TSTRING:
      return lua.lua_tojsstring(L, -1);
    case lua.LUA_TTABLE:
      return lauTableToJsObject(lua.lua_topointer(L, -1) as LuaTable);
    default:
      throw new Error(
        `Unknown return type ${type} : ${
          inspect(L.stack[L.top - 1], false, 2, true)
        }`,
      );
  }
};
