module.exports = {
  root: true,
  parserOptions: {
    ecmaVersion: 2018,
    project: ['./tsconfig.json', './tsconfig.eslint.json'],
  },
  env: {
    browser: false,
    commonjs: true,
    node: true,
  },
  reportUnusedDisableDirectives: true,

  overrides: [
    {
      files: ['*.ts'],
      parser: '@typescript-eslint/parser',
      plugins: ['@typescript-eslint', 'eslint-plugin-tsdoc'],
      extends: [
        'airbnb-typescript/base',
        'plugin:@typescript-eslint/eslint-recommended',
        'plugin:@typescript-eslint/recommended',
        'prettier/@typescript-eslint',
        'plugin:prettier/recommended',
      ],
      rules: {
        '@typescript-eslint/ban-ts-comment': [
          'error',
          {
            'ts-expect-error': 'allow-with-description',
            'ts-ignore': 'allow-with-description',
            'ts-nocheck': 'allow-with-description',
            'ts-check': 'allow-with-description',
          },
        ],
        'no-restricted-syntax': [
          'off',
          {
            selector: 'ForOfStatement',
          },
        ],
        'tsdoc/syntax': 'off', // 'warn',
      },
    },

    {
      files: ['*.js'],
      extends: ['airbnb-base', 'plugin:prettier/recommended'],
      rules: {
        'no-restricted-syntax': [
          'off',
          {
            selector: 'ForOfStatement',
          },
        ],
        'import/no-unresolved': 'off',
      },
    },

    {
      files: ['test/**'],
      rules: {
        'no-unused-expressions': 'off',
        '@typescript-eslint/no-unused-expressions': 'off',
      },
    },
  ],
};
