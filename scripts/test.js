#!/usr/bin/env node
'use strict'
const fs = require('fs')
const spawn = require('cross-spawn')
const path = require('path')

process.env.BABEL_ENV = 'test'
process.env.NODE_ENV = 'test'

process.on('unhandledRejection', (e) => {
  throw e
})

const args = process.argv.slice(2)

const babelConfig = require.resolve('../config/babelConfig')
const ownTestSetup = require.resolve('../config/testSetup.js')
const testSetup = path.join(process.cwd(), 'testSetup.js')
const mocha = require.resolve('../node_modules/.bin/mocha')
process.env.CI || args.push('--watch')
args.push('--recursive')

args.push('--require')
args.push(babelConfig)

args.push('--file')
args.push(ownTestSetup)

fs.existsSync(testSetup) && args.push(testSetup)

const globs = ['**/*.test.js', '**/*.spec.js']

args.push(globs.join(' '))

args.unshift(mocha)
console.log(args.join(' '))
const childProcess = spawn.sync(args.join(' '), {
  stdio: 'inherit',
  shell: true,
})

if (childProcess.signal) {
  console.log('computer says no')
  process.exit(1)
}

process.exit(childProcess.status)
