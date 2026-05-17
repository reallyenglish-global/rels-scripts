#!/usr/bin/env node
'use strict'

const fs = require('fs')
const spawn = require('cross-spawn')
const getMochaArgs = require('./utils/getMochaArgs')

process.env.NODE_ENV = 'test'

process.on('unhandledRejection', (e) => {
  throw e
})

// Parse arguments
const filePath = process.argv[2]

// Validate arguments
if (!filePath) {
  console.error('Error: File path required')
  console.error('Usage: pnpm test:file <file>')
  process.exit(1)
}

// Validate file exists
if (!fs.existsSync(filePath)) {
  console.error(`Error: File not found: ${filePath}`)
  console.error('Usage: pnpm test:file <file>')
  process.exit(1)
}

// Run Mocha on specific file
const args = getMochaArgs([filePath, ...process.argv.slice(3)])

const childProcess = spawn.sync(process.execPath, args, {
  stdio: 'inherit',
})

if (childProcess.signal) {
  console.log('computer says no')
  process.exit(1)
}

process.exit(childProcess.status)
