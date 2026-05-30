const envPreset = {
  useBuiltIns: false,
  loose: true,
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

