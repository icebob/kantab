module.exports = {
  root: true,
  env: {
    node: true
  },
  'extends': [
    'plugin:vue/essential',
    'eslint:recommended'
  ],
  rules: {
        "indent": [
            "warn",
            "tab",
            { "SwitchCase": 1 }
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
    parser: 'babel-eslint'
  },
  ecmaVersion: 2017,
      ecmaFeatures: {
          experimentalObjectRestSpread: true
      }
  }
};
