/*
 This babel.config is used by webpack as well as mocha and eslint configurations. 
*/
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
      {
        useBuiltIns: "usage",
        loose: true,
        corejs: 3,
      },
    ],
  ],
}
// ensure scss and hbs tranforms are done when running mocha
if (process.env.NODE_ENV === 'test') {
  config.plugins = ['handlebars-inline-precompile', 'transform-scss']
}

const cache = process.env.CI !== true
require('@babel/register', '@babel/runtime')({
  ...config,
  cache,
})

module.exports = config

