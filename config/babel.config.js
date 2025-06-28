/*
 This babel.config is used by webpack as well as mocha and eslint configurations.
 Makes corejs optional: set USE_COREJS=false to disable.
*/
const useCorejs = process.env.USE_COREJS !== 'false'

const envPreset = {
  useBuiltIns: useCorejs ? 'usage' : false,
  loose: true,
  ...(useCorejs && { corejs: 3 }),
}

const config = {
  ignore: [/node_modules\/(?!media-recorder|rels-i18n|rels-assets|rels-lib|rels-analytics)/],
  sourceType: "unambiguous",
  presets: [
    [
      require.resolve('babel-preset-react-app'),
      {
        runtime: 'classic',
      },
    ],
    [
      require.resolve('@babel/preset-env'),
      envPreset,
    ],
  ],
}

// ensure scss and hbs transforms are done when running mocha
if (process.env.NODE_ENV === 'test') {
  config.plugins = ['handlebars-inline-precompile', 'transform-scss']
}

const cache = process.env.CI !== true
require('@babel/register', '@babel/runtime')({
  ...config,
  cache,
})

module.exports = config

