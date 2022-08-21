module.exports = {
  globals: { "ts-jest": { tsconfig: "tsconfig.json" } },
  moduleFileExtensions: ["ts", "js", "tsx", "d.ts"],
  // moduleNameMapper: {
  //   "^test/(.*)$": "<rootDir>/test/$1",
  // },
  // transformIgnorePatterns: [],
  transform: {
    "^.+\\.tsx?$": "ts-jest",
    "^.+\\.js$": "babel-jest",
  },
  testRegex: "(/src/.*\\.test)\\.[tj]sx?$",
  testEnvironment: "node",
  modulePaths: ["src"],
  setupFilesAfterEnv: ["./src/test/setup.ts"],
};
