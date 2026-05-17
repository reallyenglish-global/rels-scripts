#!/usr/bin/env node
'use strict'

const spawn = require('cross-spawn')
const getMochaArgs = require('./utils/getMochaArgs')

process.env.NODE_ENV = 'test'

process.on('unhandledRejection', (e) => {
  throw e
})

// Parse arguments
const pattern = process.argv[2]

// Validate arguments
if (!pattern || pattern.trim() === '') {
  console.error('Error: Test pattern cannot be empty')
  console.error('Usage: pnpm test:case <pattern>')
  process.exit(1)
}

// Run Mocha with --grep pattern
const args = getMochaArgs([
  '--grep',
  pattern,
  'test/**/*.test.js',
  ...process.argv.slice(3),
])

const childProcess = spawn.sync(process.execPath, args, {
  stdio: 'inherit',
})

if (childProcess.signal) {
  console.log('computer says no')
  process.exit(1)
}

process.exit(childProcess.status)
