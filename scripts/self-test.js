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

// Run Mocha with output capture
const args = getMochaArgs(['test/**/*.test.js', ...process.argv.slice(2)])

const childProcess = spawn.sync(process.execPath, args, {
  stdio: 'pipe',
  encoding: 'utf8',
})

// Stream output to console in real-time
const output = childProcess.stdout || ''
const errorOutput = childProcess.stderr || ''

process.stdout.write(output)
process.stderr.write(errorOutput)

// Parse failures on test failure
if (childProcess.status !== 0) {
  const combinedOutput = output + errorOutput
  const failedFiles = extractFailedFiles(combinedOutput)

  if (failedFiles.length > 0) {
    // Write failures to JSON
    const failureData = {
      timestamp: new Date().toISOString(),
      files: failedFiles,
    }

    fs.writeFileSync(FAILURES_FILE, JSON.stringify(failureData, null, 2))

    const fileCount = failedFiles.length
    const plural = fileCount === 1 ? 'file' : 'files'
    console.log(`\nRun 'pnpm test:failed' to retry ${fileCount} failed ${plural}`)
  }
}

if (childProcess.signal) {
  console.log('computer says no')
  process.exit(1)
}

process.exit(childProcess.status)

/**
 * Extract failed test file paths from Mocha output
 * @param {string} output - Combined stdout and stderr from Mocha
 * @returns {string[]} Array of unique failed file paths
 */
function extractFailedFiles(output) {
  const fileSet = new Set()
  const lines = output.split('\n')

  // Pattern: at Context.<anonymous> (test/versioning.test.js:123:45)
  const stackTraceRegex = /at .*? \(([^:]+\.test\.js):\d+:\d+\)/

  for (const line of lines) {
    const match = line.match(stackTraceRegex)
    if (match) {
      fileSet.add(match[1])
    }
  }

  return Array.from(fileSet).sort()
}
