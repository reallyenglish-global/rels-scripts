#!/usr/bin/env node
'use strict'

const spawn = require('cross-spawn')
const resolveBin = require('./utils/resolveBin')

process.env.BABEL_ENV = 'test'
process.env.NODE_ENV = 'test'

process.on('unhandledRejection', (e) => {
  throw e
})

const eslintBin = resolveBin('eslint', 'eslint')
const config = require.resolve('../config/.eslintrc.js')
const args = [
  eslintBin,
  '--config',
  config,
  '--no-error-on-unmatched-pattern',
  './scripts/**/*.js',
  './bin/**/*.js',
  './test/**/*.test.js',
]

const childProcess = spawn.sync(process.execPath, args, {
  stdio: 'inherit',
})

if (childProcess.signal) {
  console.log('computer says no')
  process.exit(1)
}

process.exit(childProcess.status)
