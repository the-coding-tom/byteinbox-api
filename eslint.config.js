module.exports = {
  env: {
    browser: true,
    es2021: true,
  },
  extends: [
    'airbnb-base',
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 12,
    sourceType: 'module',
  },
  plugins: [
    '@typescript-eslint',
  ],
  rules: {
    'object-curly-newline': 0,
    'max-len': 0,
    'no-underscore-dangle': 0,
    'linebreak-style': 0,
    'no-restricted-syntax': 0,
    'no-dupe-keys': 0,
    'prefer-destructuring': 0,
    'no-plusplus': 0,
    'no-nested-ternary': 0,
    'no-useless-constructor': 0,
    'pprefer-default-export': 0,
    'no-unused-vars': 1,
    'no-empty-function': 1,
    'import/extensions': [
      'error',
      'ignorePackages',
      {
        'js': 'never',
        'jsx': 'never',
        'ts': 'never',
        'tsx': 'never'
      }
    ]
  },
  settings: {
    'import/resolver': {
      node: {
        extensions: ['.js', '.jsx', '.ts', '.tsx'],
        moduleDirectory: ['node_modules', 'src/'],
      },
    },
  }
};