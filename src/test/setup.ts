// deno-lint-ignore no-explicit-any
const globals = globalThis as any;

globals.print = console.log;

jest.useFakeTimers();
