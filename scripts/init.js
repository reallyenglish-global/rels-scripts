// skip for CI
if (process.env.CI === 'true') {
  console.log('skip init scripts in CI')
  process.exit(0)
}

const fs = require('fs')
const os = require('os')
const path = require('path')

const isTruthy = (value) => ['1', 'true', 'yes', 'on'].includes((value || '').toLowerCase())
const skipHookSetup =
  isTruthy(process.env.RELS_SCRIPTS_SKIP_DOWNLOAD) || isTruthy(process.env.RELS_SCRIPTS_SKIP_HOOKS)

if (skipHookSetup) {
  console.log('skip hooks setup because RELS_SCRIPTS_SKIP_DOWNLOAD/RELS_SCRIPTS_SKIP_HOOKS is set')
} else {
  require('./hooks')
}

require('./vscode')

const { appPath } = require('../config/paths')
const appPackage = require(path.join(appPath, 'package.json'))

appPackage.scripts = Object.assign(
  {
    test: 'rels-scripts test',
    format: 'rels-scripts format',
    lint: 'rels-scripts lint',
    prepare: 'rels-scripts init',
    start: 'rels-scripts start',
    build: 'rels-scripts build',
  },
  appPackage.scripts || {},
)

appPackage.release = Object.assign(
  {
    plugins: [
      '@semantic-release/commit-analyzer',
      '@semantic-release/release-notes-generator',
      '@semantic-release/github',
    ],
  },
  appPackage.release,
)

fs.writeFileSync(path.join(appPath, 'package.json'), JSON.stringify(appPackage, null, 2) + os.EOL)
