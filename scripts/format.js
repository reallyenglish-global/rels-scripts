#!/usr/bin/env node

const path = require('path')

const spawn = require('cross-spawn')

process.on('unhandledRejection', (e) => {
  throw e
})

const config = require.resolve('../config/.prettierrc.yml')
const ignore = require.resolve('../config/.prettierignore')

const args = process.argv.slice(2)
args.push(`--config ${config}`)
args.push(`--ignore-path ${ignore}`)
args.push('-w src/**/*{.js*,.scss}')
args.push('--no-error-on-unmatched-pattern')

args.unshift('npm exec --yes -- prettier')

const childProcess = spawn.sync(args.join(' '), {
  stdio: 'inherit',
  shell: true,
})

if (childProcess.signal) {
  /* eslint-disable no-console */
  console.log('computer says no')
  process.exit(1)
}

process.exit(childProcess.status)
