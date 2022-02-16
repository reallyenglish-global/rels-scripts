const fs = require('fs')
const os = require('os')
const path = require('path')

require('./hooks')
require('./vscode')

const { defaultBrowsers } = require('react-dev-utils/browsersHelper')
const { appPath } = require('../config/paths')
const appPackage = require(path.join(appPath, 'package.json'))

appPackage.scripts = Object.assign(
  {
    test: 'rels-scripts test',
    format: 'rels-scripts format',
    lint: 'rels-scripts lint',
    prepare: 'rels-scripts init',
    start: 'rels-scripts start',
  },
  appPackage.scripts || {},
)

appPackage.browserslist = defaultBrowsers

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
