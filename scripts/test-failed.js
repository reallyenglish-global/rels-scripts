#!/usr/bin/env node
'use strict'

const fs = require('fs')
const path = require('path')
const spawn = require('cross-spawn')
const getMochaArgs = require('./utils/getMochaArgs')

process.env.NODE_ENV = 'test'

process.on('unhandledRejection', (e) => {
  throw e
})

const FAILURES_FILE = path.join(process.cwd(), '.test-failures.json')

// Check if failures file exists
if (!fs.existsSync(FAILURES_FILE)) {
  console.log("No failed tests on record. Run 'pnpm test' first.")
  process.exit(0)
}

// Read and parse failures
let failureData
try {
  const content = fs.readFileSync(FAILURES_FILE, 'utf8')
  failureData = JSON.parse(content)
} catch (error) {
  console.error('Warning: Corrupted .test-failures.json, deleting...')
  fs.unlinkSync(FAILURES_FILE)
  console.error("Run 'pnpm test' to generate fresh failure data")
  process.exit(1)
}

// Check if there are any failed files
if (!failureData.files || failureData.files.length === 0) {
  console.log("No failed tests on record. Run 'pnpm test' first.")
  fs.unlinkSync(FAILURES_FILE)
  process.exit(0)
}

// Filter out files that no longer exist
const existingFiles = failureData.files.filter((file) => {
  if (!fs.existsSync(file)) {
    console.warn(`Warning: Failed test file no longer exists: ${file}`)
    return false
  }
  return true
})

// If all failed files were deleted
if (existingFiles.length === 0) {
  console.log('All previously failed test files have been deleted.')
  fs.unlinkSync(FAILURES_FILE)
  process.exit(0)
}

console.log(`Re-running ${existingFiles.length} failed test file(s)...`)

// Run Mocha on failed files
const args = getMochaArgs([...existingFiles, ...process.argv.slice(2)])

const childProcess = spawn.sync(process.execPath, args, {
  stdio: 'inherit',
})

if (childProcess.signal) {
  console.log('computer says no')
  process.exit(1)
}

// Handle results
if (childProcess.status === 0) {
  // All tests passed - clean up
  fs.unlinkSync(FAILURES_FILE)
  console.log('\nAll previously failed tests now pass!')
  process.exit(0)
} else {
  // Tests still failing - keep the file
  console.log("\nTests still failing. Fix and run 'pnpm test:failed' again.")
  process.exit(childProcess.status)
}
