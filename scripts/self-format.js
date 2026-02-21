#!/usr/bin/env node
'use strict'

const spawn = require('cross-spawn')
const resolveBin = require('./utils/resolveBin')

process.on('unhandledRejection', (e) => {
  throw e
})

const prettierBin = resolveBin('prettier', 'prettier')
const config = require.resolve('../config/.prettierrc.yml')
const ignore = require.resolve('../config/.prettierignore')
const isCheckMode = process.argv.includes('--check')
const args = [
  prettierBin,
  isCheckMode ? '--check' : '-w',
  '--config',
  config,
  '--ignore-path',
  ignore,
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
