module.exports = {
	root: true,
	env: {
		node: true
	},
	extends: ["eslint:recommended", "plugin:vue/vue3-recommended", "plugin:prettier/recommended"],
	/*parserOptions: {
		parser: "babel-eslint"
	},*/
	rules: {
		"no-console": process.env.NODE_ENV === "production" ? "warn" : "off",
		"no-debugger": process.env.NODE_ENV === "production" ? "warn" : "off",
		"no-unused-vars": "warn",
		"vue/no-unused-components": "warn",
		"no-undef": "warn"
	},
	overrides: [
		{
			files: ["**/__tests__/*.{j,t}s?(x)", "**/tests/unit/**/*.spec.{j,t}s?(x)"],
			env: {
				jest: true
			}
		}
	]
};
