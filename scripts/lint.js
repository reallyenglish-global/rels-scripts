#!/usr/bin/env node

const spawn = require('cross-spawn')

process.on('unhandledRejection', (e) => {
  throw e
})
const config = require.resolve('../config/.eslintrc.js')

const args = process.argv.slice(2)

args.push(`--config ${config}`)
args.push('--ext .js,.jsx')
args.push('src/')
args.unshift('npm exec -- eslint')
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
