'use strict'

const fs = require('fs')

const file = [require.resolve('./testSetup.js')]
fs.existsSync('testSetup.js') && file.push('testSetup.js')

const recursive = true
const colors = true
const requires = require.resolve('./babel.config.js')
const spec = ['src/**/*.test.js']
const timeout = 5000

const config = {
  recursive,
  colors,
  require: requires,
  file,
  spec,
  timeout,
}

// Allow overriding spec with a specific file or pattern
if (process.env.TEST_FILE) {
  config.spec = [process.env.TEST_FILE]
}

// Allow specifying a specific test using grep
if (process.env.TEST_GREP) {
  config.grep = process.env.TEST_GREP
}

module.exports = config
