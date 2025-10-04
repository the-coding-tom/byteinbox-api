const js = require('@eslint/js');
const typescript = require('typescript-eslint');

module.exports = [
  js.configs.recommended,
  ...typescript.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: 2021,
    sourceType: 'module',
  },
  rules: {
    'max-len': 0,
    'no-underscore-dangle': 0,
    'linebreak-style': 0,
    'no-restricted-syntax': 0,
    'no-dupe-keys': 0,
    'prefer-destructuring': 0,
    'no-plusplus': 0,
    'no-nested-ternary': 0,
    'no-useless-constructor': 0,
    'prefer-default-export': 0,
      'no-unused-vars': 'off',
    '@typescript-eslint/no-unused-vars': ['error', { 
      argsIgnorePattern: '^_',
      varsIgnorePattern: '^_',
      caughtErrorsIgnorePattern: '^_'
    }],
    'no-empty-function': 1,
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/no-empty-function': 'warn',
  },
      },
  {
    ignores: ['dist/**', 'node_modules/**'],
    },
];