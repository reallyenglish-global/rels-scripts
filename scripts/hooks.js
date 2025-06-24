#!/usr/bin/env node
'use strict'

const spawn = require('cross-spawn')
const path = require('path')
const { ownPath } = require('../config/paths')
const fs = require('fs')

if (!fs.existsSync('.git')) {
  console.log('skip hooks because .git does not exist')
  return
}

process.on('unhandledRejection', (e) => {
  throw e
})

const huskyPath = path.join(process.cwd(), '.husky')
const commitlintConfig = require.resolve(path.join(ownPath, 'config/commitlint.config.js'))

// Detect package manager
function getPackageManager() {
  if (fs.existsSync(path.join(process.cwd(), 'pnpm-lock.yaml'))) return 'pnpm'
  if (fs.existsSync(path.join(process.cwd(), 'yarn.lock'))) return 'yarn'
  return 'npm'
}

const pkgManager = getPackageManager()
const execCmd = pkgManager

const execArgs = ['exec']

const huskyInstallCmd = ['husky', 'install', huskyPath]

const installHusky = spawn.sync(
  execCmd,
  [...execArgs, ...huskyInstallCmd],
  { stdio: 'inherit', shell: true }
)

if (installHusky.signal) {
  console.log('computer says no')
  process.exit(1)
}

if (installHusky.status !== 0) {
  process.exit(installHusky.status)
}

const hooks = {
  'pre-commit': [
    'export CI=true',
    `${execCmd} ${execArgs.join(' ')} run-p test lint format`
  ],
  'commit-msg': [
    `${execCmd} ${execArgs.join(' ')} commitlint --config ${commitlintConfig} --edit $1`
  ],
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

    const command = `${execCmd} ${execArgs.join(' ')} husky add ${hookFile} '${action}'`
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
