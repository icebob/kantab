module.exports = {
	root: true,
	env: {
		node: true
	},
	"plugins": [
		"html"
	],
	'extends': [
		'eslint:recommended'
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
		]
	},
	parserOptions: {
		parser: 'babel-eslint',
		sourceType: "module",
		ecmaVersion: 2017,
		ecmaFeatures: {
			experimentalObjectRestSpread: true
		}
	}
};
