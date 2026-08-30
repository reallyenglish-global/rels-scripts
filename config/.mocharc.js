'use strict'

const fs = require('fs')
const path = require('path')

const file = [require.resolve('./testSetup.js')]
fs.existsSync('testSetup.js') && file.push('testSetup.js')

const recursive = true
const colors = true
const requires = require.resolve('./babel.config.js')
const timeout = 5000

// mocha depends on glob, so resolve it relative to mocha's own install
// location rather than adding it as a direct dependency of rels-scripts.
let hasMatches
try {
  const mochaDir = path.dirname(require.resolve('mocha/package.json'))
  const glob = require(require.resolve('glob', { paths: [mochaDir] }))
  hasMatches = (pattern) => glob.sync(pattern).length > 0
} catch (err) {
  // Fall back to a coarse directory check if glob can't be resolved.
  hasMatches = (pattern) => fs.existsSync(pattern.split('/')[0])
}

// src/**/*.test.js is the existing, unconditional default. The other
// patterns are only added when they actually match files, so consumers
// without test/ or src/**/*.spec.js specs don't get mocha's "Cannot find
// any files matching pattern" warning.
const spec = ['src/**/*.test.js']
hasMatches('src/**/*.spec.js') && spec.push('src/**/*.spec.js')
hasMatches('test/**/*.spec.js') && spec.push('test/**/*.spec.js')

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
