# Smart Test Execution Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add per-file and per-test-case test execution with automatic failure tracking

**Architecture:** Thin wrapper scripts around Mocha CLI. Enhanced self-test.js captures failures to .test-failures.json. New scripts (test-file, test-case, test-failed) provide targeted test execution without reimplementing test running logic.

**Tech Stack:** Node.js, Mocha, cross-spawn

---

## File Structure

**Files to create:**
- `scripts/utils/getMochaArgs.js` - Shared Mocha configuration
- `scripts/test-file.js` - Run specific test file
- `scripts/test-case.js` - Run tests matching pattern
- `scripts/test-failed.js` - Re-run previously failed files

**Files to modify:**
- `scripts/self-test.js` - Add failure tracking
- `package.json` - Add new test scripts
- `.gitignore` - Exclude .test-failures.json

---

### Task 1: Extract Shared Mocha Configuration

**Files:**
- Create: `scripts/utils/getMochaArgs.js`

- [ ] **Step 1: Create getMochaArgs utility**

```javascript
#!/usr/bin/env node
'use strict'

const resolveBin = require('./resolveBin')

/**
 * Returns the base Mocha arguments used across all test scripts
 * @param {string[]} additionalArgs - Additional arguments to append
 * @returns {string[]} Array of arguments for spawn
 */
function getMochaArgs(additionalArgs = []) {
  const mochaBin = resolveBin('mocha', 'mocha')
  
  return [
    mochaBin,
    '--recursive',
    '--timeout',
    '10000',
    ...additionalArgs,
  ]
}

module.exports = getMochaArgs
```

- [ ] **Step 2: Verify the file was created**

Run: `ls -la scripts/utils/getMochaArgs.js`
Expected: File exists

- [ ] **Step 3: Commit**

```bash
git add scripts/utils/getMochaArgs.js
git commit -m "refactor: extract shared Mocha configuration

Creates getMochaArgs utility to ensure consistent Mocha config
across all test scripts (self-test, test-file, test-case, test-failed).

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 2: Create test-file.js Script

**Files:**
- Create: `scripts/test-file.js`

- [ ] **Step 1: Create test-file.js script**

```javascript
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
```

- [ ] **Step 2: Make script executable**

Run: `chmod +x scripts/test-file.js`
Expected: Script is executable

- [ ] **Step 3: Test with valid file**

Run: `node scripts/test-file.js test/versioning.test.js`
Expected: Runs tests in versioning.test.js only

- [ ] **Step 4: Test with invalid file**

Run: `node scripts/test-file.js test/does-not-exist.test.js`
Expected: Prints "Error: File not found: test/does-not-exist.test.js"

- [ ] **Step 5: Test with no arguments**

Run: `node scripts/test-file.js`
Expected: Prints "Error: File path required" and usage

- [ ] **Step 6: Commit**

```bash
git add scripts/test-file.js
git commit -m "feat: add test:file script for per-file test execution

Allows running tests in a specific file with validation.
Usage: pnpm test:file test/versioning.test.js

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 3: Create test-case.js Script

**Files:**
- Create: `scripts/test-case.js`

- [ ] **Step 1: Create test-case.js script**

```javascript
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
```

- [ ] **Step 2: Make script executable**

Run: `chmod +x scripts/test-case.js`
Expected: Script is executable

- [ ] **Step 3: Test with valid pattern**

Run: `node scripts/test-case.js "semantic-release"`
Expected: Runs only tests matching "semantic-release"

- [ ] **Step 4: Test with empty pattern**

Run: `node scripts/test-case.js ""`
Expected: Prints "Error: Test pattern cannot be empty" and usage

- [ ] **Step 5: Test with no arguments**

Run: `node scripts/test-case.js`
Expected: Prints "Error: Test pattern cannot be empty" and usage

- [ ] **Step 6: Commit**

```bash
git add scripts/test-case.js
git commit -m "feat: add test:case script for pattern-based test execution

Allows running tests matching a pattern using Mocha's --grep.
Usage: pnpm test:case 'semantic-release'

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 4: Create test-failed.js Script

**Files:**
- Create: `scripts/test-failed.js`

- [ ] **Step 1: Create test-failed.js script**

```javascript
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
```

- [ ] **Step 2: Make script executable**

Run: `chmod +x scripts/test-failed.js`
Expected: Script is executable

- [ ] **Step 3: Test with no failures file**

Run: `node scripts/test-failed.js`
Expected: Prints "No failed tests on record. Run 'pnpm test' first."

- [ ] **Step 4: Test with corrupted JSON**

```bash
echo "invalid json" > .test-failures.json
node scripts/test-failed.js
```
Expected: Prints warning, deletes file, exits 1

- [ ] **Step 5: Test with valid failures (create mock file)**

```bash
echo '{"timestamp":"2026-05-17T10:00:00.000Z","files":["test/versioning.test.js"]}' > .test-failures.json
node scripts/test-failed.js
```
Expected: Re-runs versioning.test.js, shows success message if tests pass

- [ ] **Step 6: Clean up test file**

Run: `rm -f .test-failures.json`
Expected: File removed

- [ ] **Step 7: Commit**

```bash
git add scripts/test-failed.js
git commit -m "feat: add test:failed script to re-run failed tests

Reads .test-failures.json and re-runs previously failed test files.
Deletes the file on success, keeps it on failure.
Usage: pnpm test:failed

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 5: Enhance self-test.js with Failure Tracking

**Files:**
- Modify: `scripts/self-test.js`

- [ ] **Step 1: Read current self-test.js**

Run: `cat scripts/self-test.js`
Expected: See current implementation

- [ ] **Step 2: Replace self-test.js with failure tracking**

```javascript
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
```

- [ ] **Step 3: Verify tests run normally**

Run: `node scripts/self-test.js`
Expected: Tests run, output appears, no .test-failures.json (all tests pass)

- [ ] **Step 4: Test failure tracking (introduce failing test)**

```bash
# Add a temporary failing test to versioning.test.js
cat >> test/versioning.test.js << 'EOF'

it('temporary failing test', () => {
  throw new Error('This test should fail')
})
EOF
```

- [ ] **Step 5: Run tests and verify failure tracking**

Run: `node scripts/self-test.js`
Expected: 
- Tests run and fail
- .test-failures.json created
- Message shows "Run 'pnpm test:failed' to retry 1 failed file"

- [ ] **Step 6: Verify .test-failures.json content**

Run: `cat .test-failures.json`
Expected: JSON with timestamp and files array containing "test/versioning.test.js"

- [ ] **Step 7: Remove temporary failing test**

```bash
git checkout test/versioning.test.js
rm -f .test-failures.json
```

- [ ] **Step 8: Commit**

```bash
git add scripts/self-test.js
git commit -m "feat: add automatic failure tracking to test runner

Enhanced self-test.js to capture Mocha output, parse stack traces,
and write failed test files to .test-failures.json. Shows message
prompting user to run 'pnpm test:failed' after failures.

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 6: Update package.json Scripts

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Read current scripts section**

Run: `grep -A 10 '"scripts"' package.json`
Expected: See current test script

- [ ] **Step 2: Add new test scripts to package.json**

Add these scripts to the "scripts" section (after "test"):

```json
    "test:file": "node ./scripts/test-file.js",
    "test:case": "node ./scripts/test-case.js",
    "test:failed": "node ./scripts/test-failed.js",
```

- [ ] **Step 3: Verify package.json is valid JSON**

Run: `node -e "require('./package.json')"`
Expected: No errors

- [ ] **Step 4: Test pnpm scripts**

Run: `pnpm test:file test/versioning.test.js`
Expected: Runs only versioning tests

- [ ] **Step 5: Test pnpm test:case**

Run: `pnpm test:case "semantic-release"`
Expected: Runs only matching tests

- [ ] **Step 6: Test pnpm test:failed with no failures**

Run: `pnpm test:failed`
Expected: "No failed tests on record. Run 'pnpm test' first."

- [ ] **Step 7: Commit**

```bash
git add package.json
git commit -m "feat: add test:file, test:case, test:failed scripts

New pnpm scripts:
- test:file <path> - run specific test file
- test:case <pattern> - run tests matching pattern
- test:failed - re-run previously failed tests

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 7: Update .gitignore

**Files:**
- Modify: `.gitignore`

- [ ] **Step 1: Check if .gitignore exists**

Run: `ls -la .gitignore`
Expected: File exists or file not found

- [ ] **Step 2: Add .test-failures.json to .gitignore**

If .gitignore exists:
```bash
echo ".test-failures.json" >> .gitignore
```

If .gitignore doesn't exist:
```bash
echo ".test-failures.json" > .gitignore
```

- [ ] **Step 3: Verify .gitignore content**

Run: `cat .gitignore | grep test-failures`
Expected: Shows ".test-failures.json"

- [ ] **Step 4: Commit**

```bash
git add .gitignore
git commit -m "chore: add .test-failures.json to .gitignore

Failure tracking file is local development state,
should not be checked into version control.

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 8: Manual Testing

**Files:**
- None (validation only)

- [ ] **Step 1: Test full suite with failures**

```bash
# Add temporary failing test
cat >> test/versioning.test.js << 'EOF'

it('temporary test for validation', () => {
  throw new Error('Intentional failure for testing')
})
EOF

# Run full suite
pnpm test
```

Expected:
- Test fails
- .test-failures.json created
- Message: "Run 'pnpm test:failed' to retry 1 failed file"

- [ ] **Step 2: Test pnpm test:failed with failures**

Run: `pnpm test:failed`
Expected: Re-runs test/versioning.test.js only, still fails

- [ ] **Step 3: Fix test and re-run**

```bash
# Remove failing test
git checkout test/versioning.test.js

# Re-run failed tests
pnpm test:failed
```

Expected:
- Tests pass
- .test-failures.json deleted
- Message: "All previously failed tests now pass!"

- [ ] **Step 4: Test per-file execution**

Run: `pnpm test:file test/toolchain-smoke.test.js`
Expected: Runs only toolchain-smoke tests

- [ ] **Step 5: Test per-case execution**

Run: `pnpm test:case "uses semantic-release"`
Expected: Runs only tests with "semantic-release" in the name

- [ ] **Step 6: Test invalid file path**

Run: `pnpm test:file test/does-not-exist.test.js`
Expected: Error message and usage

- [ ] **Step 7: Test empty pattern**

Run: `pnpm test:case ""`
Expected: Error message and usage

- [ ] **Step 8: Test corrupted failures file**

```bash
echo "invalid json" > .test-failures.json
pnpm test:failed
```

Expected: Warning about corruption, file deleted, error message

- [ ] **Step 9: Clean up**

Run: `rm -f .test-failures.json`
Expected: Any test artifacts removed

- [ ] **Step 10: Verify full suite still works**

Run: `pnpm test`
Expected: All tests pass, no .test-failures.json created

---

## Completion Checklist

- [ ] All scripts are executable
- [ ] All scripts handle error cases gracefully
- [ ] pnpm test tracks failures automatically
- [ ] pnpm test:failed re-runs only failed files
- [ ] pnpm test:file runs single file
- [ ] pnpm test:case runs matching tests
- [ ] .test-failures.json in .gitignore
- [ ] No breaking changes to existing pnpm test
- [ ] Manual testing completed successfully
