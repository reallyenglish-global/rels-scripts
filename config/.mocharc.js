'use stricts'

const fs = require('fs')

const file = [require.resolve('./testSetup.js')]
fs.existsSync('testSetup.js') && file.push('testSetup.js')

const recursive = true
const colors = true
const requires = require.resolve('./babel.config.js')
const spec = ['src/**/*.test.js']

const config = {
  recursive,
  colors,
  require: requires,
  file,
  spec,
}

module.exports = config
