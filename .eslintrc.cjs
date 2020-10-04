module.exports = {
	extends: ["verit"],
	rules: {
		eqeqeq: ["error", "always", { null: "never" }],
	},
	settings: {
		react: {
			pragma: "React",
			version: "16.2",
		},
	},
};
