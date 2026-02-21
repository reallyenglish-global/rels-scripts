#!/usr/bin/env node

const spawn = require('cross-spawn')
const resolveBin = require('./utils/resolveBin')

process.env.BABEL_ENV = 'development'
process.env.NODE_ENV = 'development'

process.on('unhandledRejection', (e) => {
  throw e
})
const config = require.resolve('../config/.eslintrc.js')
const eslintBin = resolveBin('eslint', 'eslint')

const args = process.argv.slice(2)

args.push('--config', config)
args.push('--ext', '.js,.jsx')
args.push('src/')
const childProcess = spawn.sync(process.execPath, [eslintBin, ...args], {
  stdio: 'inherit',
})

if (childProcess.signal) {
  /* eslint-disable no-console */
  console.log('computer says no')
  process.exit(1)
}

process.exit(childProcess.status)
