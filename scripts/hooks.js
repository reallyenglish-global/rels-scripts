'use strict'

const spawn = require('cross-spawn')
const path = require('path')
const { ownPath } = require('../config/paths')
const fs = require('fs')
const os = require('os')
process.on('unhandledRejection', (e) => {
  throw e
})

const huskyPath = path.join(process.cwd(), '.husky')
const commitlintConfig = require.resolve(path.join(ownPath, 'config/commitlint.config.js'))

const installHusky = spawn.sync(`npm exec -- husky install ${huskyPath}`, {
  stdio: 'inherit',
  shell: true,
})

if (installHusky.signal) {
  console.log('computer says no')
  process.exit(1)
}

if (installHusky.status !== 0) {
  process.exit(installHusky.status)
}

const hooks = {
  'pre-commit': [`export CI=true`, `npm exec -- run-p test lint format`],
  'commit-msg': [`npm exec -- commitlint --config ${commitlintConfig} --edit $1`],
}

Object.keys(hooks).forEach((hookName) => {
  const hookFile = `${huskyPath}/${hookName}`

  const actions = hooks[hookName]
  actions.forEach((action) => {
    if (fs.existsSync(hookFile)) {
      const grep = spawn.sync(`grep "${action}" ${hookFile}`, {
        stdio: 'ignore',
        shell: true,
      })
      if (grep.status === 0) {
        return
      }
    }

    const command = `npm exec husky add ${hookFile} '${action}'`
    const childProcess = spawn.sync(command, { stdio: 'inherit', shell: true })

    if (childProcess.signal) {
      console.log('computer says no')
      process.exit(1)
    }

    if (childProcess.status !== 0) {
      process.exit(childProcess.status)
    }
  })
})
