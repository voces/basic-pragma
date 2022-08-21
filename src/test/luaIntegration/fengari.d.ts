type TString = {
  hash: string;
  realstring: Uint8Array;
};

type TValueNumber = {
  type: LUA_TNUMBER;
  value: number;
};

type TValueTable = {
  type: LUA_TTABLE;
  value: LuaTable;
};

type TValueFunction = {
  type: LUA_TFUNCTION;
  value: { p: { k: [TValue] } };
};

type TValueNumberLiteral = {
  type: 19; // string literal?
  value: number;
};

type TValueString = {
  type: 20; // string literal?
  value: TString;
};

type TValue =
  | TValueString
  | TValueTable
  | TValueNumber
  | TValueFunction
  | TValueNumberLiteral;

type LuaTable = {
  id: number;
  strong: Map<string, { key: TValue; value: TValue }>;
};

type LuaState = {
  stack: TValue[];
  top: number;
};

type LUA_OK = 0;
type LUA_YIELD = 1;
type LUA_ERRRUN = 2;
type LUA_ERRSYNTAX = 3;
type LUA_ERRMEM = 4;
type LUA_ERRGCMM = 5;
type LUA_ERRERR = 6;
type Status =
  | LUA_OK
  | LUA_YIELD
  | LUA_ERRRUN
  | LUA_ERRSYNTAX
  | LUA_ERRMEM
  | LUA_ERRGCMM
  | LUA_ERRERR;

type LUA_TNONE = -1;
type LUA_TNIL = 0;
type LUA_TBOOLEAN = 1;
type LUA_TLIGHTUSERDATA = 2;
type LUA_TNUMBER = 3;
type LUA_TSTRING = 4;
type LUA_TTABLE = 5;
type LUA_TFUNCTION = 6;
type LUA_TUSERDATA = 7;
type LUA_TTHREAD = 8;
type LuaType =
  | LUA_TNONE
  | LUA_TNIL
  | LUA_TBOOLEAN
  | LUA_TLIGHTUSERDATA
  | LUA_TNUMBER
  | LUA_TSTRING
  | LUA_TUSERDATA
  | LUA_TTABLE
  | LUA_TFUNCTION
  | LUA_TTHREAD;

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
    LUA_OK: LUA_OK;
    LUA_YIELD: LUA_YIELD;
    LUA_ERRRUN: LUA_ERRRUN;
    LUA_ERRSYNTAX: LUA_ERRSYNTAX;
    LUA_ERRMEM: LUA_ERRMEM;
    LUA_ERRGCMM: LUA_ERRGCMM;
    LUA_ERRERR: LUA_ERRERR;
    LUA_TNONE: LUA_TNONE;
    LUA_TNIL: LUA_TNIL;
    LUA_TBOOLEAN: LUA_TBOOLEAN;
    LUA_TLIGHTUSERDATA: LUA_TLIGHTUSERDATA;
    LUA_TNUMBER: LUA_TNUMBER;
    LUA_TSTRING: LUA_TSTRING;
    LUA_TUSERDATA: LUA_TUSERDATA;
    LUA_TTABLE: LUA_TTABLE;
    LUA_TFUNCTION: LUA_TFUNCTION;
    LUA_TTHREAD: LUA_TTHREAD;
    lua_tojsstring: (L: LuaState, index: number) => string;
    lua_todataview: (L: LuaState, index: number) => unknown[];
    lua_topointer: (L: LuaState, index: number) => unknown;
    lua_toproxy: (L: LuaState, index: number) => typeof Proxy;
    lua_rawget: (L: LuaState, index: number) => unknown;
    lua_gettable: (L: LuaState, index: number) => unknown;
    lua_pop: (L: LuaState, count: number) => void;
    lua_type: (L: LuaState, index: number) => LuaType;
    lua_pushcfunction: (L: LuaState, impl: () => void) => void;
    lua_tocfunction: (L: LuaState, index: number) => (L: LuaState) => number;
    lua_register: (
      L: LuaState,
      name: string,
      impl: (L: LuaState) => number,
    ) => void;
    lua_call: (L: LuaState, nargs: number, nresults: number) => void;
  };
  const lualib: {
    luaL_openlibs: (L: LuaState) => void;
  };
}
