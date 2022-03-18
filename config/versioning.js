/* eslint-disable no-console */

const semanticRelease = require('semantic-release')
const spawn = require('cross-spawn')
const paths = require('./paths')

const getBranchName = () => {
  const gitBranch = spawn.sync('git', ['branch', '--show-current'], {
    encoding: 'utf-8',
  })

  if (gitBranch.signal) {
    console.log('computer says no')
    process.exit(1)
  }

  if (gitBranch.status !== 0) {
    console.log(gitBranch.status)
    process.exit(gitBranch.status)
  }

  return gitBranch.stdout.trim()
}

const branch = getBranchName()

module.exports = () => {
  return semanticRelease({
    branches: [branch],
    tagFormat: 'v${version}', // eslint-disable-line no-template-curly-in-string
    plugins: ['@semantic-release/commit-analyzer'],
    dryRun: true,
    cwd: process.cwd(),
  }).then((result) => {
    const appName = require(paths.appPackageJson).name
    const appEnvKey = appName.replace(/-/g, '_').toUpperCase()
    const { gitTag, gitHead } = result.nextRelease
    Object.assign(process.env, {
      [`${appEnvKey}_VERSION`]: `${gitTag}-${branch}`,
      [`${appEnvKey}_REVISION`]: `${gitHead}-${branch}`,
      [`${appEnvKey}_BRANCH`]: branch,
    })
  })
}
