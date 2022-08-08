module.exports = {
	globals: { "ts-jest": { tsconfig: "tsconfig.json" } },
	moduleFileExtensions: ["ts", "js"],
	moduleNameMapper: {
		"^test/(.*)$": "<rootDir>/test/$1",
	},
	transformIgnorePatterns: [],
	transform: {
		"^.+\\.ts$": "ts-jest",
		"^.+\\.js$": "babel-jest",
	},
	testRegex: "(/src/.*\\.test)\\.[tj]s$",
	testEnvironment: "node",
	modulePaths: ["src"],
	setupFilesAfterEnv: ["./src/test/setup.ts"],
};
