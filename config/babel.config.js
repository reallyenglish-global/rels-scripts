/*
 This babel.config is used by webpack as well as mocha and eslint configurations. 
*/
const config = {
  ignore: [/node_modules\/(?!media-recorder|rels-i18n|rels-assets|rels-lib|rels-analytics)/],
  presets: [
    [
      require.resolve('babel-preset-react-app'),
      {
        runtime: 'classic',
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
