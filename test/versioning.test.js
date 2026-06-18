/* eslint-env mocha */
'use strict'

const assert = require('assert')

const versioningPath = require.resolve('../config/versioning')
const pathsPath = require.resolve('../config/paths')
const semanticReleasePath = require.resolve('semantic-release')

const loadVersioning = (semanticReleaseExport) => {
  delete require.cache[versioningPath]
  delete require.cache[pathsPath]

  require.cache[semanticReleasePath] = {
    id: semanticReleasePath,
    filename: semanticReleasePath,
    loaded: true,
    exports: semanticReleaseExport,
  }

  return require('../config/versioning')
}

let originalBranch
let originalSemanticRelease

describe('versioning', () => {
  beforeEach(() => {
    originalBranch = process.env.TRAVIS_BRANCH
    originalSemanticRelease = require.cache[semanticReleasePath]
  })

  afterEach(() => {
    delete require.cache[versioningPath]
    delete require.cache[pathsPath]

    if (originalSemanticRelease) {
      require.cache[semanticReleasePath] = originalSemanticRelease
    } else {
      delete require.cache[semanticReleasePath]
    }

    if (originalBranch === undefined) {
      delete process.env.TRAVIS_BRANCH
    } else {
      process.env.TRAVIS_BRANCH = originalBranch
    }

    delete process.env.RELS_SCRIPTS_VERSION
    delete process.env.RELS_SCRIPTS_REVISION
    delete process.env.RELS_SCRIPTS_BRANCH
  })

  it('supports semantic-release default exports', async () => {
    process.env.TRAVIS_BRANCH = 'main'

    const release = async () => ({
      nextRelease: {
        gitTag: 'v2.0.0',
        gitHead: 'abc123',
      },
    })

    const versioning = loadVersioning({ default: release })

    await versioning()

    assert.strictEqual(process.env.RELS_SCRIPTS_VERSION, 'v2.0.0-main')
    assert.strictEqual(process.env.RELS_SCRIPTS_REVISION, 'abc123-main')
    assert.strictEqual(process.env.RELS_SCRIPTS_BRANCH, 'main')
  })
})
