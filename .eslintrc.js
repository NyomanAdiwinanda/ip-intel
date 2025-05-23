module.exports = {
	root: true,
	parser: "@typescript-eslint/parser",
	plugins: ["@typescript-eslint"],
	extends: ["eslint:recommended", "plugin:@typescript-eslint/recommended", "prettier"],
	env: {
		node: true,
		es2020: true,
		jest: true,
	},
	rules: {
		"@typescript-eslint/no-explicit-any": "off",
	},
};
