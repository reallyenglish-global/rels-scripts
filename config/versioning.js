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

const branch = process.env.TRAVIS_BRANCH || getBranchName()

const config = {
  branches: [branch],
  tagFormat: 'v${version}', // eslint-disable-line no-template-curly-in-string
  plugins: ['@semantic-release/commit-analyzer'],
  dryRun: true,
  cwd: process.cwd(),
}
module.exports = () => {
  return semanticRelease(config).then((result) => {
    if (result.nextRelease == undefined) {
      console.log('fail to get a release version', config, result)
      return
    }
    const appName = require(paths.appPackageJson).name
    const appEnvKey = appName.replace(/-/g, '_').toUpperCase()
    const { gitTag='unreleased', gitHead='unknown' } = result.nextRelease ?? {}
    Object.assign(process.env, {
      [`${appEnvKey}_VERSION`]: `${gitTag}-${branch}`,
      [`${appEnvKey}_REVISION`]: `${gitHead}-${branch}`,
      [`${appEnvKey}_BRANCH`]: branch,
    })
  })
}
