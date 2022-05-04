module.exports = {
  root: true,
  parser: require.resolve('@babel/eslint-parser'),
  env: {
    browser: true,
    es6: true,
    commonjs: true,
    node: true,
  },
  extends: ['eslint:recommended'],
  rules: {
    semi: 0,
    'comma-dangle': 0,
    'no-bitwise': 0,
    'no-underscore-dangle': 0,
    'no-plusplus': 0,
    'no-unused-expressions': 0,
    'global-require': 0,
    camelcase: 0,
    'object-curly-newline': [
      'error',
      { ImportDeclaration: { multiline: true, minProperties: 10 }, ObjectPattern: 'never' },
    ],
    'semi-style': ['error', 'first'],
  },
  parserOptions: {
    sourceType: 'module',
    babelOptions: {
      configFile: require.resolve('./babel.config.js'),
    },
  },
  overrides: [
    {
      files: ['./**/*.test.js', './**/*.spec.js'],
      env: { mocha: true },
      plugins: ['mocha'],
      rules: {
        'mocha/no-mocha-arrows': 0,
      },
      globals: {
        expect: true,
        sinon: true,
        factory: true,
      },
      extends: ['plugin:mocha/recommended'],
    },
  ],
}
