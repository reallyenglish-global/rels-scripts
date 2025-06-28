/*
 This babel.config is used by webpack as well as mocha and eslint configurations.
 Modernized for best practices and modern browser support.
*/
const config = {
  ignore: [
    /node_modules\/(?!media-recorder|rels-i18n|rels-assets|rels-lib|rels-analytics)/,
  ],
  sourceType: "unambiguous",
  presets: [
    [
      require.resolve('babel-preset-react-app'),
      {
        runtime: 'automatic', // Use the modern JSX transform if possible
      },
    ],
    [
      require.resolve('@babel/preset-env'),
      {
        targets: [
          'last 2 Chrome versions',
          'last 2 Firefox versions',
          'last 2 Safari versions',
          'last 2 Edge versions',
          'not dead',
        ],
        useBuiltIns: false, // No polyfills needed for modern browsers
        modules: false,
        loose: true,
        // corejs removed for modern setup
      },
    ],
  ],
  plugins: [
    ['module-resolver', {
      root: ['./src'], // Adjust this to your source code root
      extensions: ['.js', '.hbs', '.json'], // Add all relevant file extensions
      alias: {
        // Add any aliases you might use, e.g.:
        // '@constants': './src/constants',
        // '@utils': './src/utils',
      }
    }],
  ],
}

// Add test-specific plugins
if (process.env.NODE_ENV === 'test') {
  config.plugins = [
    ...config.plugins,
    require.resolve('babel-plugin-handlebars-inline-precompile'),
    require.resolve('babel-plugin-transform-scss'),
  ]
}

// Only enable cache if not running in CI
const cache = process.env.CI !== 'true'

// Only register Babel if this file is loaded directly (not when imported as a config)
if (require.main === module) {
  require('@babel/register')({
    ...config,
    cache,
  })
}

module.exports = config

