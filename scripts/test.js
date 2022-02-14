#!/usr/bin/env node
'use strict'
const spawn = require('cross-spawn')

process.env.BABEL_ENV = 'test'
process.env.NODE_ENV = 'test'

process.on('unhandledRejection', (e) => {
  throw e
})

const args = process.argv.slice(2)
const config = require.resolve('../config/.mocharc.js')

process.env.CI || args.push('--watch')
args.push(`--config ${config}`)

args.unshift('npm exec -- mocha')

const childProcess = spawn.sync(args.join(' '), {
  stdio: 'inherit',
  shell: true,
})

if (childProcess.signal) {
  console.log('computer says no')
  process.exit(1)
}

process.exit(childProcess.status)
