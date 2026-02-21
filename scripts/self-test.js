#!/usr/bin/env node
'use strict'

const spawn = require('cross-spawn')
const resolveBin = require('./utils/resolveBin')

process.env.NODE_ENV = 'test'

process.on('unhandledRejection', (e) => {
  throw e
})

const mochaBin = resolveBin('mocha', 'mocha')
const args = [
  mochaBin,
  '--recursive',
  '--timeout',
  '10000',
  'test/**/*.test.js',
  ...process.argv.slice(2),
]

const childProcess = spawn.sync(process.execPath, args, {
  stdio: 'inherit',
})

if (childProcess.signal) {
  console.log('computer says no')
  process.exit(1)
}

process.exit(childProcess.status)
