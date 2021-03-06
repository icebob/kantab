module.exports = {
	root: true,
	env: {
		node: true,
		commonjs: true,
		es6: true,
		jquery: false,
		jest: true,
		jasmine: true
	},
	extends: ["eslint:recommended", "plugin:prettier/recommended"],
	//plugins: ["prettier"],
	parserOptions: {
		sourceType: "module",
		ecmaVersion: 9
	},
	rules: {
		semi: ["error", "always"],
		"no-var": ["error"],
		"no-console": ["off"],
		"no-unused-vars": ["warn"]
	}
};
