#!/usr/bin/env node
'use strict'

const spawn = require('cross-spawn')
const path = require('path')
const fs = require('fs')
const resolveBin = require('./utils/resolveBin')

if (!fs.existsSync('.git')) {
  console.log('skip hooks because .git does not exist')
  process.exit(0)
}

process.on('unhandledRejection', (e) => {
  throw e
})

const huskyPath = path.join(process.cwd(), '.husky')
const huskyBin = resolveBin('husky', 'husky')

console.log('installing husky', huskyBin)
const installHusky = spawn.sync(process.execPath, [huskyBin, 'install', huskyPath], {
  stdio: 'inherit',
})

if (installHusky.signal) {
  console.log('computer says no')
  process.exit(1)
}

if (installHusky.status !== 0 && process.env.CI !== 'true') {
  process.exit(installHusky.status)
}

const hooks = {
  'pre-commit': ['export CI=true', 'rels-scripts pre-commit'],
  'commit-msg': ['rels-scripts commit-msg --edit "$1"'],
}

const legacyHookCommandPatterns = {
  'pre-commit': [/^corepack pnpm exec run-p test lint format$/m],
  'commit-msg': [/^corepack pnpm exec commitlint.*$/m],
}

Object.keys(hooks).forEach((hookName) => {
  const hookFile = `${huskyPath}/${hookName}`

  if (fs.existsSync(hookFile) && legacyHookCommandPatterns[hookName]) {
    let content = fs.readFileSync(hookFile, 'utf8')
    legacyHookCommandPatterns[hookName].forEach((pattern) => {
      content = content.replace(pattern, '').replace(/\n{3,}/g, '\n\n')
    })
    fs.writeFileSync(hookFile, content)
  }

  const actions = hooks[hookName]
  actions.forEach((action) => {
    if (fs.existsSync(hookFile)) {
      const content = fs.readFileSync(hookFile, 'utf8')
      if (content.includes(action)) {
        return
      }
    }

    const childProcess = spawn.sync(process.execPath, [huskyBin, 'add', hookFile, action], {
      stdio: 'inherit',
    })

    if (childProcess.signal) {
      console.log('computer says no')
      process.exit(1)
    }

    if (childProcess.status !== 0) {
      process.exit(childProcess.status)
    }
  })
})
