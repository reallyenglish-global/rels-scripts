module.exports = function (api) {
  api.cache(true) // Enable caching for faster rebuilds

  return {
    presets: [
      [
        '@babel/preset-env',
        {
          useBuiltIns: false, // Set to 'usage' and add corejs if you need polyfills
          modules: false,
          targets: [
            'last 2 Chrome versions',
            'last 2 Firefox versions',
            'last 2 Safari versions',
            'last 2 Edge versions',
            'not dead',
          ],
        },
      ],
      // Uncomment if you use React:
      // '@babel/preset-react',
    ],
    plugins: [
      [
        '@babel/plugin-transform-runtime',
        {
          absoluteRuntime: false,
          // corejs: 3, // Uncomment if you want runtime polyfills
        },
      ],
    ],
  }
}
