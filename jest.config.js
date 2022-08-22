module.exports = {
  globals: { "ts-jest": { tsconfig: "tsconfig.json" } },
  moduleFileExtensions: ["ts", "js", "tsx", "d.ts"],
  transform: { "^.+\\.tsx?$": "ts-jest" },
  testRegex: "(/src/.*\\.test)\\.[tj]sx?$",
  testEnvironment: "node",
  modulePaths: ["src"],
  setupFilesAfterEnv: ["./src/test/setup.ts"],
};
