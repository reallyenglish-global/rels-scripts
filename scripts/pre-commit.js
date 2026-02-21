#!/usr/bin/env node
'use strict'

const spawn = require('cross-spawn')
const resolveBin = require('./utils/resolveBin')

process.on('unhandledRejection', (e) => {
  throw e
})

process.env.CI = 'true'

const runPBin = resolveBin('npm-run-all', 'run-p')
const childProcess = spawn.sync(process.execPath, [runPBin, 'test', 'lint', 'format'], {
  stdio: 'inherit',
})

if (childProcess.signal) {
  console.log('computer says no')
  process.exit(1)
}

process.exit(childProcess.status)
