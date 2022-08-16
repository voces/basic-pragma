type TString = {
  hash: string;
  realstring: Uint8Array;
};

type TValueString = {
  type: 20;
  value: TString;
};

type TValueTable = {
  type: 5;
  value: LuaTable;
};

type TValueNumber = {
  type: 19;
  value: number;
};

type TValue = TValueString | TValueTable | TValueNumber;

type LuaTable = {
  id: number;
  strong: Map<string, { key: TValue; value: TValue }>;
};

type LuaState = {
  stack: TValue[];
  top: number;
};

enum Status {
  LUA_OK = 0,
  LUA_YIELD,
  LUA_ERRRUN,
  LUA_ERRSYNTAX,
  LUA_ERRMEM,
  LUA_ERRGCMM,
  LUA_ERRERR,
}

enum LuaType {
  LUATNONE = 0,
  LUA_TNIL,
  LUA_TBOOLEAN,
  LUA_TLIGHTUSERDATA,
  LUA_TNUMBER,
  LUA_TSTRING,
  LUA_TUSERDATA,
  LUA_TTABLE,
  LUA_TFUNCTION,
  LUA_TTHREAD,
}

declare module "fengari" {
  const lauxlib: {
    luaL_newstate: () => LuaState;
    luaL_requiref: (
      L: LuaState,
      name: Uint8Array,
      callback: (L: LuaState) => 0,
      unk: 1,
    ) => void;
    luaL_dostring: (L: LuaState, code: Uint8Array) => Status;
  };
  const to_luastring: (str: string, cache?: boolean) => Uint8Array;
  const lua: {
    LUA_OK: 0;
    // LUATNONE: 0;
    // LUA_TNIL: 0;
    // LUA_TBOOLEAN: 0;
    // LUA_TLIGHTUSERDATA: 0;
    // LUA_TNUMBER: 0;
    // LUA_TSTRING: 0;
    // LUA_TUSERDATA: 0;
    // LUA_TTABLE: 0;
    // LUA_TFUNCTION: 0;
    // LUA_TTHREAD: 0;
    lua_tojsstring: (L: LuaState, index: number) => string;
    lua_todataview: (L: LuaState, index: number) => unknown[];
    lua_topointer: (L: LuaState, index: number) => unknown;
    lua_toproxy: (L: LuaState, index: number) => Proxy;
    lua_rawget: (L: LuaState, index: number) => unknown;
    lua_gettable: (L: LuaState, index: number) => unknown;
    lua_pop: (L: LuaState, count: number) => void;
    lua_type: (L: LuaState, index: number) => LuaType;
  };
  const lualib: {
    luaL_openlibs: (L: LuaState) => void;
  };
}
