import { mkdir, rm, symlink } from "fs/promises";
import { exec, ExecException } from "child_process";
import { inspect } from "util";

const execPromise = (cmd: string) =>
  new Promise<{ out: string; error: ExecException | null }>((resolve) =>
    exec(cmd, { cwd: process.cwd() }, (error, out) => resolve({ out, error }))
  );

beforeAll(async () => {
  // Link basic-pragma
  await rm("src/test/jsIntegration/node_modules", {
    recursive: true,
    force: true,
  });
  await mkdir("src/test/jsIntegration/node_modules");
  await symlink(
    "../../../..",
    "./src/test/jsIntegration/node_modules/basic-pragma",
  );

  // Convert source.tsx to JS
  const { error, out } = await execPromise(
    "node_modules/.bin/tsc --project src/test/jsIntegration/tsconfig.jsIntegration.json",
  );
  if (error) {
    if (out) error.message += out;
    throw error;
  }
}, 10_000);

it("js integration test", async () => {
  // const ret = await import("./dist/source.js" as string).then((i) => i.default);
  const { error, out } = await execPromise(
    "node src/test/jsIntegration/dist/source.js",
  );

  expect(error).toBeNull();

  const messages: unknown[] = out.split("\n").slice(0, -1).map((v) => {
    try {
      return JSON.parse(v);
    } catch {
      return v;
    }
  });

  if (messages.length > 1) {
    console.log(
      messages.slice(0, -1).map((m) =>
        typeof m === "string" ? m : inspect(m, false, 2, true)
      ).join("\n"),
    );
  }

  expect(messages[messages.length - 1]).toEqual({
    type: "frame",
    val: (2 * 3 + 1) * 5 * 7,
    onClick: "[Function anonymous]",
    // First update on state change; second on context change
    propHistory: [{
      type: "frame",
      val: 2 * 3 * 5 * 7,
      onClick: "[Function anonymous]",
    }, {
      type: "frame",
      val: (2 * 3 + 1) * 5 * 7,
      onClick: "[Function anonymous]",
    }],
  });
});
