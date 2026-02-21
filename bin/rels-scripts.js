#!/usr/bin/env node
'use strict'

const spawn = require('cross-spawn')
const SCRIPTS = ['test', 'format', 'lint', 'init', 'start', 'build', 'pre-commit', 'commit-msg']
const args = process.argv.slice(2)

const index = args.findIndex((arg) => SCRIPTS.includes(arg))
const task = args[index]

if (!task) {
  console.log(`rels-scripts does not support '${args[0]}'`)
  process.exit(1)
}

args.splice(index, 1, require.resolve('../scripts/' + task))
const childProcess = spawn.sync(process.execPath, args, { stdio: 'inherit' })

if (childProcess.signal) {
  console.log('computer says no')
  process.exit(1)
}

process.exit(childProcess.status)
