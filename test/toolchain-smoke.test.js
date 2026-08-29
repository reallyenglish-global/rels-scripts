/* eslint-env mocha */
'use strict'

const assert = require('assert')
const fs = require('fs')
const os = require('os')
const path = require('path')
const spawn = require('cross-spawn')
const resolveBin = require('../scripts/utils/resolveBin')

const repoRoot = path.resolve(__dirname, '..')
const cliPath = path.join(repoRoot, 'bin', 'rels-scripts.js')
const initPath = path.join(repoRoot, 'scripts', 'init.js')

const runNode = (scriptPath, args = [], options = {}) =>
  spawn.sync(process.execPath, [scriptPath, ...args], {
    encoding: 'utf8',
    ...options,
  })

describe('toolchain smoke tests', () => {
  it('shows an error for unsupported commands', () => {
    const result = runNode(cliPath, ['does-not-exist'])

    assert.strictEqual(result.status, 1)
    assert.match(result.stdout, /rels-scripts does not support 'does-not-exist'/)
  })

  it('recognizes modern development and formatting tasks', () => {
    const source = fs.readFileSync(cliPath, 'utf8')

    assert.match(source, /'dev'/)
    assert.match(source, /'serve'/)
    assert.match(source, /'format:check'/)
  })

  it('defaults build and start routing to Vite', () => {
    const buildSource = fs.readFileSync(path.join(repoRoot, 'scripts', 'build.js'), 'utf8')
    const startSource = fs.readFileSync(path.join(repoRoot, 'scripts', 'start.js'), 'utf8')

    assert.match(buildSource, /process\.env\.BUNDLER \|\| 'vite'/)
    assert.match(startSource, /process\.env\.BUNDLER \|\| 'vite'/)
  })

  it('routes dev and serve aliases through the bundler dispatcher', () => {
    for (const task of ['dev', 'serve']) {
      const result = runNode(cliPath, [task], {
        env: { ...process.env, BUNDLER: 'unsupported-test-bundler' },
      })

      assert.strictEqual(result.status, 1)
      assert.match(result.stderr, /Unknown bundler: unsupported-test-bundler/)
    }
  })

  it('keeps committed hooks portable', () => {
    const preCommit = fs.readFileSync(path.join(repoRoot, '.husky', 'pre-commit'), 'utf8')
    const commitMsg = fs.readFileSync(path.join(repoRoot, '.husky', 'commit-msg'), 'utf8')

    assert.doesNotMatch(
      `${preCommit}\n${commitMsg}`,
      /\/Users\/|rels-scripts pre-commit|rels-scripts commit-msg/,
    )
    assert.match(preCommit, /scripts\/pre-commit\.js/)
    assert.match(commitMsg, /scripts\/commit-msg\.js/)
  })

  it('resolves local eslint binary path', () => {
    const eslintBin = resolveBin('eslint', 'eslint')

    assert.ok(fs.existsSync(eslintBin), `eslint bin not found: ${eslintBin}`)
  })

  it('skips hook setup when RELS_SCRIPTS_SKIP_HOOKS is set', () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'rels-init-smoke-'))
    const packageJsonPath = path.join(tempDir, 'package.json')

    try {
      fs.writeFileSync(
        packageJsonPath,
        JSON.stringify({ name: 'rels-init-smoke', version: '1.0.0' }),
      )

      const result = runNode(initPath, [], {
        cwd: tempDir,
        env: {
          ...process.env,
          CI: 'false',
          RELS_SCRIPTS_SKIP_HOOKS: 'true',
        },
      })

      const output = `${result.stdout || ''}${result.stderr || ''}`
      assert.strictEqual(result.status, 0, output)
      assert.match(output, /skip hooks setup because RELS_SCRIPTS_SKIP_HOOKS is set/)
      assert.strictEqual(fs.existsSync(path.join(tempDir, '.husky')), false)
      assert.strictEqual(fs.existsSync(path.join(tempDir, '.vscode', 'settings.json')), true)
    } finally {
      fs.rmSync(tempDir, { recursive: true, force: true })
    }
  })

  it('runs bundled commit-msg task', () => {
    const result = runNode(cliPath, ['commit-msg', '--help'])

    assert.strictEqual(result.status, 0, result.stderr)
    assert.match(result.stdout, /@commitlint\/cli/)
  })
})
