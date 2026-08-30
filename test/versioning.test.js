/* eslint-env mocha */
'use strict'

const assert = require('assert')
const fs = require('fs')
const os = require('os')
const path = require('path')
const spawn = require('cross-spawn')

const repoRoot = path.resolve(__dirname, '..')
const versioningPath = path.join(repoRoot, 'config', 'versioning.js')

/*
  versioning() mutates process.env of whatever process runs it, and config/paths
  resolves the consuming app from process.cwd(). Both make it awkward to exercise
  in-process, so each case runs in a throwaway app directory in a child process,
  mirroring the init smoke test.

  A child that exits 42 means versioning() rejected. That must never happen: a
  rejection propagates through the unhandledRejection handler in build-webpack.js
  and build-vite.js and kills the build.
*/
const REJECTED = 42

function createApp({ name = 'rels-demo-app', version = '9.9.9' } = {}) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'rels-versioning-'))
  fs.writeFileSync(path.join(dir, 'package.json'), JSON.stringify({ name, version }))
  return dir
}

function runVersioning(dir, env = {}) {
  const harness = path.join(dir, 'run-versioning.cjs')
  const outputPath = path.join(dir, 'versioning-result.json')
  // semantic-release logs to stdout, so results go to a file rather than a pipe
  fs.writeFileSync(
    harness,
    `
    const fs = require('fs')
    const versioning = require(${JSON.stringify(versioningPath)})
    const pkg = require('./package.json')
    const key = pkg.name.replace(/-/g, '_').toUpperCase()
    versioning()
      .then(() => {
        fs.writeFileSync(${JSON.stringify(outputPath)}, JSON.stringify({
          version: process.env[key + '_VERSION'],
          revision: process.env[key + '_REVISION'],
          branch: process.env[key + '_BRANCH'],
        }))
        process.exit(0)
      })
      .catch((error) => {
        process.stderr.write('REJECTED: ' + error.message)
        process.exit(${REJECTED})
      })
    `,
  )

  const baseEnv = { ...process.env }
  // keep the ambient checkout from leaking into the temp app
  delete baseEnv.TRAVIS_BRANCH
  delete baseEnv.GITHUB_REF_NAME
  delete baseEnv.RELS_BRANCH
  // git hooks (this suite runs under husky's pre-commit) set these so the
  // hook process resolves the real repo. Without stripping them, versioning()
  // and any git commands the temp app runs would target this checkout's
  // .git instead of the throwaway app directory.
  delete baseEnv.GIT_DIR
  delete baseEnv.GIT_WORK_TREE
  delete baseEnv.GIT_INDEX_FILE
  delete baseEnv.GIT_COMMON_DIR
  delete baseEnv.GIT_PREFIX

  const result = spawn.sync(process.execPath, [harness], {
    cwd: dir,
    encoding: 'utf8',
    env: { ...baseEnv, ...env },
  })

  return {
    status: result.status,
    stdout: result.stdout || '',
    stderr: result.stderr || '',
    parsed: (() => {
      try {
        return JSON.parse(fs.readFileSync(outputPath, 'utf8'))
      } catch {
        return null
      }
    })(),
  }
}

function git(dir, args) {
  // Same reasoning as runVersioning(): strip the repo-identifying env vars a
  // git hook sets so these commands operate on the throwaway `dir`, not on
  // whatever repository invoked this test suite.
  const env = { ...process.env }
  delete env.GIT_DIR
  delete env.GIT_WORK_TREE
  delete env.GIT_INDEX_FILE
  delete env.GIT_COMMON_DIR
  delete env.GIT_PREFIX

  return spawn.sync('git', args, { cwd: dir, encoding: 'utf8', env })
}

describe('config/versioning', () => {
  const created = []

  const app = (options) => {
    const dir = createApp(options)
    created.push(dir)
    return dir
  }

  after(() => {
    created.forEach((dir) => fs.rmSync(dir, { recursive: true, force: true }))
  })

  it('resolves instead of rejecting outside a git repository', () => {
    const dir = app()
    const result = runVersioning(dir)

    assert.notStrictEqual(result.status, REJECTED, `versioning() rejected: ${result.stderr}`)
    assert.strictEqual(result.status, 0, result.stderr)
  })

  it('falls back to the package.json version when git describes nothing', () => {
    const dir = app({ version: '9.9.9' })
    const result = runVersioning(dir)

    assert.ok(result.parsed, `no output: ${result.stderr}`)
    assert.match(result.parsed.version, /9\.9\.9/)
  })

  it('derives the env var prefix from the app name', () => {
    const dir = app({ name: 'rels-lib' })
    const harness = path.join(dir, 'read-key.cjs')
    fs.writeFileSync(
      harness,
      `
      const versioning = require(${JSON.stringify(versioningPath)})
      versioning().then(() => {
        process.stdout.write(JSON.stringify({
          version: process.env.RELS_LIB_VERSION,
          branch: process.env.RELS_LIB_BRANCH,
        }))
      })
      `,
    )
    const result = spawn.sync(process.execPath, [harness], { cwd: dir, encoding: 'utf8' })
    const parsed = JSON.parse(result.stdout)

    assert.ok(parsed.version, `expected RELS_LIB_VERSION to be set: ${result.stderr}`)
  })

  it('keeps a version that the environment already provided', () => {
    const dir = app({ name: 'rels-demo-app' })
    const result = runVersioning(dir, { RELS_DEMO_APP_VERSION: 'v-from-ci' })

    assert.ok(result.parsed, result.stderr)
    assert.strictEqual(result.parsed.version, 'v-from-ci')
  })

  it('prefers RELS_BRANCH over TRAVIS_BRANCH', () => {
    const dir = app()
    const result = runVersioning(dir, { RELS_BRANCH: 'chosen', TRAVIS_BRANCH: 'legacy' })

    assert.ok(result.parsed, result.stderr)
    assert.strictEqual(result.parsed.branch, 'chosen')
  })

  it('still honours TRAVIS_BRANCH for consumers that set it', () => {
    const dir = app()
    const result = runVersioning(dir, { TRAVIS_BRANCH: 'production' })

    assert.ok(result.parsed, result.stderr)
    assert.strictEqual(result.parsed.branch, 'production')
  })

  it('still resolves when semantic-release is opted in but cannot run', () => {
    const dir = app()
    const result = runVersioning(dir, { RELS_SCRIPTS_SEMANTIC_VERSION: 'true' })

    assert.notStrictEqual(result.status, REJECTED, `versioning() rejected: ${result.stderr}`)
    assert.strictEqual(result.status, 0, result.stderr)
    assert.ok(result.parsed.version, 'expected a fallback version')
  })

  it('uses the nearest tag when the app is a tagged git repository', () => {
    const dir = app({ version: '0.0.1' })
    git(dir, ['init', '-q'])
    git(dir, ['config', 'user.email', 'test@example.com'])
    git(dir, ['config', 'user.name', 'test'])
    git(dir, ['add', '.'])
    git(dir, ['commit', '-qm', 'chore: initial'])
    git(dir, ['tag', 'v3.2.1'])

    const result = runVersioning(dir)

    assert.ok(result.parsed, result.stderr)
    assert.match(result.parsed.version, /3\.2\.1/)
    assert.ok(result.parsed.revision, 'expected a revision')
  })
})
