import { mkdir, readFile, rm, symlink } from "fs/promises";
import { exec, ExecException } from "child_process";
import { runLua } from "./lua";

const execPromise = (cmd: string) =>
  new Promise<{ out: string; error: ExecException | null }>((resolve) =>
    exec(cmd, { cwd: process.cwd() }, (error, out) => resolve({ out, error }))
  );

// TODO: could in theory modify this to run multiple tests after the one time cost of transpilation
let lua = "";

beforeAll(async () => {
  // Link basic-pragma
  await rm("src/test/luaIntegration/node_modules", {
    recursive: true,
    force: true,
  });
  await mkdir("src/test/luaIntegration/node_modules");
  await symlink(
    "../../../..",
    "./src/test/luaIntegration/node_modules/basic-pragma",
  );

  // Convert source.tsx to Lua
  const { error, out } = await execPromise(
    "node_modules/.bin/tstl --project src/test/luaIntegration/tsconfig.luaIntegration.json",
  );
  if (error) {
    if (out) error.message += out;
    throw error;
  }

  // Read Lua file
  lua = await readFile(
    "src/test/luaIntegration/dist/output.lua",
    "utf-8",
  );
}, 10_000);

it("lua integration test", async () => {
  const ret = await runLua(lua);

  expect(ret.children).toEqual([{
    type: "frame",
    val: (2 * 3 + 1) * 5 * 7,
    onClick: "[Function anonymous]",
    propHistory: [{
      type: "frame",
      val: 2 * 3 * 5 * 7,
      onClick: "[Function anonymous]",
    }],
  }]);
});
