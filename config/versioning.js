/* eslint-disable no-console */

const spawn = require('cross-spawn')
const paths = require('./paths')

/*
  Stamps <APP>_VERSION, <APP>_REVISION and <APP>_BRANCH into process.env so the
  webpack/vite DefinePlugin can expose them to the app.

  This runs on the critical path of every build, so it must never reject. It used
  to call semantic-release unconditionally, which needs a resolvable
  repositoryUrl and a reachable git remote; without those it rejected, and the
  unhandledRejection handlers in build-webpack.js and build-vite.js turned that
  into a failed build over a decorative version string.

  Resolution order, cheapest and most reliable first:
    1. a value the environment already provided (CI can stamp whatever it likes)
    2. semantic-release, only when explicitly opted in, and never fatally
    3. the nearest git tag, resolved offline
    4. the version in the app's package.json
    5. a literal placeholder
*/

const FALLBACK_VERSION = 'unreleased'
const FALLBACK_REVISION = 'unknown'
const FALLBACK_BRANCH = 'unknown'

const TRUTHY = new Set(['1', 'true', 'yes'])

const usesSemanticRelease = () => TRUTHY.has(String(process.env.RELS_SCRIPTS_SEMANTIC_VERSION).toLowerCase())

const git = (args) => {
  const result = spawn.sync('git', args, { encoding: 'utf-8' })

  if (result.error || result.signal || result.status !== 0) {
    return null
  }

  const output = (result.stdout || '').trim()
  return output || null
}

const appPackage = () => {
  try {
    return require(paths.appPackageJson)
  } catch (error) {
    console.log(`rels-scripts: could not read the app package.json (${error.message})`)
    return {}
  }
}

const resolveBranch = () => {
  const provided =
    process.env.RELS_BRANCH || process.env.GITHUB_REF_NAME || process.env.TRAVIS_BRANCH

  if (provided) {
    return provided
  }

  return git(['branch', '--show-current']) || FALLBACK_BRANCH
}

const semanticReleaseVersion = async (branch) => {
  try {
    const semanticRelease = require('semantic-release')
    const result = await semanticRelease({
      branches: [branch],
      tagFormat: 'v${version}', // eslint-disable-line no-template-curly-in-string
      plugins: [
        [
          '@semantic-release/commit-analyzer',
          {
            releaseRules: [
              { type: 'feat', release: 'minor' },
              { type: 'fix', release: 'patch' },
              { type: 'chore', release: 'patch' },
            ],
          },
        ],
      ],
      dryRun: true,
      cwd: process.cwd(),
    })

    return result && result.nextRelease ? result.nextRelease : null
  } catch (error) {
    console.log(`rels-scripts: semantic-release could not determine a version (${error.message})`)
    return null
  }
}

module.exports = async () => {
  const { name, version } = appPackage()

  if (!name) {
    console.log('rels-scripts: app package.json has no name, skipping version stamping')
    return
  }

  const appEnvKey = name.replace(/-/g, '_').toUpperCase()
  const versionKey = `${appEnvKey}_VERSION`
  const revisionKey = `${appEnvKey}_REVISION`
  const branchKey = `${appEnvKey}_BRANCH`
  const branch = resolveBranch()

  process.env[branchKey] = process.env[branchKey] || branch

  // Anything the environment already set wins, so CI stays in control.
  if (process.env[versionKey] && process.env[revisionKey]) {
    return
  }

  const release = usesSemanticRelease() ? await semanticReleaseVersion(branch) : null
  const tag = release ? release.gitTag : git(['describe', '--tags', '--abbrev=0'])
  const head = release ? release.gitHead : git(['rev-parse', 'HEAD'])
  const packageVersion = version ? `v${version}` : null

  const resolvedVersion = tag || packageVersion || FALLBACK_VERSION
  const resolvedRevision = head || FALLBACK_REVISION

  process.env[versionKey] = process.env[versionKey] || `${resolvedVersion}-${branch}`
  process.env[revisionKey] = process.env[revisionKey] || `${resolvedRevision}-${branch}`
}
