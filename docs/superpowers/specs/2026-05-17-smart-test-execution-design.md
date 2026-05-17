# Smart Test Execution Design

**Date:** 2026-05-17  
**Status:** Approved

## Problem

Running the full test suite repeatedly during development is inefficient. Developers need:
1. Per-file test execution to iterate quickly on failures
2. Per-test-case execution for debugging specific scenarios
3. Automatic failure tracking to avoid re-running passing tests
4. Clear workflow: fix failed file → validate full suite

## Solution

Enhance the test infrastructure with thin wrapper scripts that:
- Track test failures automatically in `.test-failures.json`
- Provide targeted test execution (file-level, test-case-level)
- Enable fast iteration with `pnpm test:failed`
- Maintain backward compatibility with existing `pnpm test`

## Architecture

### Current State
- `pnpm test` → `scripts/self-test.js` → runs Mocha on all tests

### Proposed State
- `pnpm test` → enhanced `self-test.js` → runs all tests + tracks failures
- `pnpm test:file <path>` → `scripts/test-file.js` → runs specific file
- `pnpm test:case <pattern>` → `scripts/test-case.js` → runs tests matching pattern
- `pnpm test:failed` → `scripts/test-failed.js` → re-runs previously failed files

**Design Principle:** All scripts are thin wrappers around Mocha CLI. They compose Mocha commands and handle bookkeeping, but don't reimplement test running logic.

## Components

### 1. Enhanced `scripts/self-test.js` (Modified)

**Current behavior:**
- Spawns Mocha with `--recursive test/**/*.test.js`
- Passes through stdio
- Returns Mocha's exit code

**New behavior:**
- Same Mocha execution
- Captures stdout/stderr to detect failures
- Parses output to extract failed test file paths
- Writes failures to `.test-failures.json`
- On failure: prints "Run 'pnpm test:failed' to retry X failed file(s)"
- Returns original exit code

**Implementation notes:**
- Use `spawn` with `stdio: 'pipe'` to capture output
- Stream output to console in real-time while also buffering
- Parse after Mocha exits, not during streaming
- Only write `.test-failures.json` if parsing succeeds

### 2. New `scripts/test-file.js`

**Purpose:** Run tests in a specific file

**Usage:**
```bash
pnpm test:file test/versioning.test.js
```

**Behavior:**
- Validates file path exists
- Spawns Mocha with same config as self-test.js
- Targets only the specified file
- Direct stdio passthrough (no failure tracking)
- Returns Mocha's exit code

**Error handling:**
- If file doesn't exist: print error and exit 1
- If no file argument: print usage and exit 1

### 3. New `scripts/test-case.js`

**Purpose:** Run tests matching a name pattern

**Usage:**
```bash
pnpm test:case "uses semantic-release"
```

**Behavior:**
- Validates pattern is non-empty
- Spawns Mocha with `--grep <pattern>`
- Searches all test files
- Direct stdio passthrough (no failure tracking)
- Returns Mocha's exit code

**Error handling:**
- If empty pattern: print error and usage, exit 1
- Mocha's --grep handles regex validation

### 4. New `scripts/test-failed.js`

**Purpose:** Re-run previously failed test files

**Usage:**
```bash
pnpm test:failed
```

**Behavior:**
- Reads `.test-failures.json`
- If missing/empty: prints "No failed tests on record. Run 'pnpm test' first." and exits 0
- If corrupted JSON: prints warning, deletes file, exits 1
- Spawns Mocha with failed file paths
- On success (exit 0):
  - Deletes `.test-failures.json`
  - Prints "All previously failed tests now pass!"
  - Exits 0
- On failure (exit 1):
  - Keeps `.test-failures.json` unchanged
  - Prints "Tests still failing. Fix and run 'pnpm test:failed' again."
  - Exits 1

**Error handling:**
- Corrupted JSON: delete file, print error, exit 1
- Files no longer exist: skip them, warn user
- All failed files deleted: treat as success, clean up JSON

## Failure Tracking

### `.test-failures.json` Format

```json
{
  "timestamp": "2026-05-17T10:30:45.123Z",
  "files": [
    "test/versioning.test.js",
    "test/toolchain-smoke.test.js"
  ]
}
```

**Why file-level tracking?**
- Simpler implementation (no test name parsing/escaping)
- Matches workflow: fix the file, then validate
- Mocha shows which tests failed when you re-run the file
- Avoids complexity of `--grep` pattern escaping

### Failure Detection Logic

**Approach:** Parse Mocha output for stack traces

**Pattern:**
```
at Context.<anonymous> (test/versioning.test.js:123:45)
```

**Algorithm:**
1. Split output by newlines
2. For each line matching the stack trace pattern:
   - Extract file path (e.g., `test/versioning.test.js`)
   - Add to failures set (automatic deduplication)
3. Convert set to array, write to JSON with timestamp

**Conservative behavior:**
- If no failures detected in output: don't write `.test-failures.json`
- If parsing fails: don't write `.test-failures.json`
- Mocha's exit code is still returned (failure is still reported)

### Git Integration

Add to `.gitignore`:
```
.test-failures.json
```

This file is local development state, not checked into version control.

## Data Flow

### Scenario 1: Full Test Run with Failures

```
User: pnpm test
  ↓
self-test.js: spawn('mocha', ['--recursive', 'test/**/*.test.js'])
  ↓
Mocha: runs all tests, 2 fail in test/versioning.test.js
  ↓
self-test.js: captures output, parses stack traces
  ↓
Extract: ["test/versioning.test.js"]
  ↓
Write: .test-failures.json with timestamp + files array
  ↓
Print: "Run 'pnpm test:failed' to retry 1 failed file(s)"
  ↓
Exit: 1 (Mocha's exit code)
```

### Scenario 2: Retry Failed Tests

```
User: pnpm test:failed
  ↓
test-failed.js: read .test-failures.json
  ↓
Found: ["test/versioning.test.js"]
  ↓
spawn('mocha', ['test/versioning.test.js'])
  ↓
Success path (exit 0):
  ├─ Delete .test-failures.json
  ├─ Print "All previously failed tests now pass!"
  └─ Exit 0
  ↓
Failure path (exit 1):
  ├─ Keep .test-failures.json unchanged
  ├─ Print "Tests still failing. Fix and run 'pnpm test:failed' again."
  └─ Exit 1
```

### Scenario 3: Target Specific File

```
User: pnpm test:file test/versioning.test.js
  ↓
test-file.js: validate file exists
  ↓
spawn('mocha', ['test/versioning.test.js'])
  ↓
Direct stdio passthrough, no failure tracking
  ↓
Exit: Mocha's exit code
```

### Scenario 4: Target Specific Test Case

```
User: pnpm test:case "semantic-release"
  ↓
test-case.js: validate pattern non-empty
  ↓
spawn('mocha', ['--grep', 'semantic-release', 'test/**/*.test.js'])
  ↓
Mocha searches all files for matching test names
  ↓
Direct stdio passthrough, no failure tracking
  ↓
Exit: Mocha's exit code
```

## Error Handling

### Invalid File Path

```bash
$ pnpm test:file test/does-not-exist.test.js
Error: File not found: test/does-not-exist.test.js
Usage: pnpm test:file <file>
# Exit 1
```

### Empty Test Pattern

```bash
$ pnpm test:case ""
Error: Test pattern cannot be empty
Usage: pnpm test:case <pattern>
# Exit 1
```

### No Failures Recorded

```bash
$ pnpm test:failed
No failed tests on record. Run 'pnpm test' first.
# Exit 0 (not an error, nothing to do)
```

### Corrupted Failure Data

```bash
$ pnpm test:failed
Warning: Corrupted .test-failures.json, deleting...
Run 'pnpm test' to generate fresh failure data
# Exit 1
```

### Mocha Not Found

```bash
# Let resolveBin() error bubble up (same as current behavior)
Cannot find module 'mocha'
# Exit 1
```

### Parsing Failures

```bash
# If stack trace regex doesn't match Mocha output
# Conservative: don't write .test-failures.json
# Still return Mocha's exit code (failure reported)
# User can manually use test:file
```

### Deduplication

```bash
# Multiple failures in same file
Extract: ["test/a.test.js", "test/a.test.js", "test/b.test.js"]
  ↓
Deduplicate: Set(["test/a.test.js", "test/b.test.js"])
  ↓
Write: ["test/a.test.js", "test/b.test.js"]
```

## Package.json Changes

```json
{
  "scripts": {
    "test": "node ./scripts/self-test.js",
    "test:file": "node ./scripts/test-file.js",
    "test:case": "node ./scripts/test-case.js",
    "test:failed": "node ./scripts/test-failed.js",
    "format": "node ./scripts/self-format.js",
    "format:check": "node ./scripts/self-format.js --check",
    "lint": "node ./scripts/self-lint.js",
    "prepare": "node ./scripts/init.js"
  }
}
```

## Testing Strategy

### Manual Testing Checklist

1. **Full suite with failures:**
   - Introduce a failing test
   - Run `pnpm test`
   - Verify `.test-failures.json` created
   - Verify message shows "pnpm test:failed"

2. **Retry failures:**
   - Run `pnpm test:failed`
   - Verify only failed file runs
   - Fix test, run again
   - Verify success message and JSON deleted

3. **Per-file execution:**
   - Run `pnpm test:file test/versioning.test.js`
   - Verify only that file runs
   - Try invalid path, verify error

4. **Per-case execution:**
   - Run `pnpm test:case "semantic-release"`
   - Verify only matching tests run
   - Try empty pattern, verify error

5. **Edge cases:**
   - Manually corrupt `.test-failures.json`, run `test:failed`
   - Delete a failed file, run `test:failed`
   - Run `test:failed` with no JSON file

### Test File Coverage

Since this is testing infrastructure, we won't add unit tests for the test scripts themselves (meta-testing). Manual validation is sufficient.

## Future Enhancements

**Not in scope for this design:**

1. **Watch mode:** Auto-rerun on file changes
2. **Test-case-level failure tracking:** Track individual test names
3. **Coverage integration:** Track coverage delta on failed tests
4. **Parallel execution:** Run failed files in parallel
5. **Smart test selection:** Run tests affected by changed files

These can be added later if needed, but would increase complexity significantly.

## Success Criteria

1. `pnpm test` tracks failures automatically
2. `pnpm test:failed` re-runs only failed files
3. `pnpm test:file <path>` runs single file quickly
4. `pnpm test:case <pattern>` runs matching tests
5. No breaking changes to existing `pnpm test` behavior
6. All error cases handled gracefully
7. `.test-failures.json` in `.gitignore`

## Non-Goals

- Replace Mocha with custom test runner
- Parse individual test case names from output
- Interactive prompts (keep scripts non-interactive)
- Test result history/trending
- Integration with CI (this is for local development)
