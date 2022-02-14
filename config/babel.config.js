const config = {
  plugins: [
    [
      require.resolve('@babel/plugin-transform-runtime'),
      {
        absoluteRuntime: true,
        corejs: { version: 3, proposals: true },
      },
    ],
  ],
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

// const cache = process.env.CI !== true

module.exports = config
