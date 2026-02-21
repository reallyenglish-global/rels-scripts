#!/usr/bin/env node
'use strict'
const spawn = require('cross-spawn')
const resolveBin = require('./utils/resolveBin')

process.env.BABEL_ENV = 'test'
process.env.NODE_ENV = 'test'

process.on('unhandledRejection', (e) => {
  throw e
})

const args = process.argv.slice(2)
const config = require.resolve('../config/.mocharc.js')
const mochaBin = resolveBin('mocha', 'mocha')

process.env.CI || args.push('--watch')
args.push('--config', config)

const childProcess = spawn.sync(process.execPath, [mochaBin, ...args], {
  stdio: 'inherit',
})

if (childProcess.signal) {
  console.log('computer says no')
  process.exit(1)
}

process.exit(childProcess.status)
