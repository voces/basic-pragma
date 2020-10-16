module.exports = {
	extends: ["verit"],
	parserOptions: { project: "tsconfig.json" },
	rules: {
		eqeqeq: ["error", "always", { null: "never" }],
		"@typescript-eslint/no-unnecessary-type-assertion": ["error"]
	},
	settings: { react: { pragma: "React", version: "16.2" } },
};
