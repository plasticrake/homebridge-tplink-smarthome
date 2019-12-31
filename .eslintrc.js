module.exports = {
  env: {
    browser: false,
    commonjs: true,
    node: true,
  },
  extends: ['airbnb-base', 'plugin:prettier/recommended'],
  parserOptions: {
    ecmaVersion: 2018,
  },
  reportUnusedDisableDirectives: true,
  rules: {
    'no-restricted-syntax': [
      'off',
      {
        selector: 'ForOfStatement',
      },
    ],
  },
};
