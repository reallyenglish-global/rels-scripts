'use strict'

const path = require('path')
const fs = require('fs')
const os = require('os')

const settingsDir = path.join(process.cwd(), '.vscode')
const settingsPath = path.join(settingsDir, 'settings.json')

const prettierConfig = require.resolve('../config/.prettierrc.yml')
const prettierIgnore = require.resolve('../config/.prettierignore')
const prettier = require.resolve('prettier')
const eslintConfig = require.resolve('../config/.eslintrc.js')

const config = {
  'prettier.configPath': prettierConfig,
  'prettier.ignorePath': prettierIgnore,
  'prettier.prettierPath': prettier,
  'eslint.options': {
    overrideConfigFile: eslintConfig,
  },
}

fs.existsSync(settingsDir) || fs.mkdirSync(settingsDir)

const settings = fs.existsSync(settingsPath) ? require(settingsPath) : {}

Object.assign(settings, config)

fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2) + os.EOL)

console.log('pritter and eslint .vscode configurations complete')
