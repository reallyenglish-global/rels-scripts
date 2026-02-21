#!/usr/bin/env node
'use strict'

const spawn = require('cross-spawn')
const resolveBin = require('./utils/resolveBin')

process.on('unhandledRejection', (e) => {
  throw e
})

const commitlintBin = resolveBin('@commitlint/cli', 'commitlint')
const config = require.resolve('../config/commitlint.config.js')
const args = process.argv.slice(2)

if (!args.includes('--config')) {
  args.unshift('--config', config)
}

const childProcess = spawn.sync(process.execPath, [commitlintBin, ...args], {
  stdio: 'inherit',
})

if (childProcess.signal) {
  console.log('computer says no')
  process.exit(1)
}

process.exit(childProcess.status)
