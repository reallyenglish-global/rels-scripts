const config = {
  ignore: [/node_modules\/(?!media-recorder|rels-i18n|rels-assets|rels-lib|rels-analytics)/],
  plugins: [
    [
      '@babel/transform-runtime',
      //{ absoluteRuntime: true, corejs: { version: 3, proposals: true }, }, -> this will break sinon fakeTimers
      // https://stackoverflow.com/questions/61020746/configure-babel-runtime-corejs3-to-exclude-es-date-now
    ],
    'handlebars-inline-precompile',
    '@babel/plugin-proposal-class-properties',
  ],
  env: {
    development: {
      compact: false,
    },
  },
  presets: [
    [
      '@babel/preset-env',
      {
        debug: false,
        targets: {
          browsers: [
            'Explorer 11',
            'last 1 Chrome versions',
            'last 1 FireFox versions',
            'last 1 Safari versions',
            'last 1 Edge versions',
          ],
        },
      },
    ],
  ],
}

if (process.env.NODE_ENV !== 'production') {
  config.plugins.push('transform-scss')
}

const cache = process.env.CI !== true
require('@babel/register', '@babel/runtime')({
  ...config,
  cache,
})
