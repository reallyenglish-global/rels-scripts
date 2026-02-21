#!/usr/bin/env node

const spawn = require('cross-spawn')
const resolveBin = require('./utils/resolveBin')

process.on('unhandledRejection', (e) => {
  throw e
})

const config = require.resolve('../config/.prettierrc.yml')
const ignore = require.resolve('../config/.prettierignore')
const prettierBin = resolveBin('prettier', 'prettier')

const args = process.argv.slice(2)
args.push('--config', config)
args.push('--ignore-path', ignore)
args.push('--no-error-on-unmatched-pattern')

const childProcess = spawn.sync(process.execPath, [prettierBin, ...args], {
  stdio: 'inherit',
})

if (childProcess.signal) {
  console.log('computer says no')
  process.exit(1)
}

process.exit(childProcess.status)
