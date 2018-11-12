module.exports = {
	root: true,
	env: {
		node: true,
		jasmine: true,
		jest: true,
	},
	"plugins": [
		"vue"
	],
	"extends": [
		"eslint:recommended",
		"plugin:vue/essential"
	],
	rules: {
		"indent": [
			"warn",
			"tab",
			{
				"SwitchCase": 1
			}
		],
		"quotes": [
			"warn",
			"double"
		],
		"semi": [
			"error",
			"always"
		],
		"no-var": [
			"error"
		],
		"no-console": [
			"off"
		],
		"no-unused-vars": [
			"warn"
		],
		"no-mixed-spaces-and-tabs": [
			"warn"
		],
		"space-before-function-paren": [
			"warn",
			{
				"anonymous": "never",
				"named": "never",
				"asyncArrow": "always"
			}
		],
		"object-curly-spacing": [
			"warn",
			"always"
		]
	},
	parserOptions: {
		parser: "babel-eslint",
		sourceType: "module",
		ecmaVersion: 9
	}
};
