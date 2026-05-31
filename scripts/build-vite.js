'use strict'

const versioning = require('../config/versioning')

process.env.BABEL_ENV = 'production'
process.env.NODE_ENV = 'production'

process.on('unhandledRejection', (err) => {
  throw err
})

require('../config/env')

const path = require('path')
const chalk = require('react-dev-utils/chalk')
const fs = require('fs-extra')
const { build } = require('vite')
const configFactory = require('../config/vite.config')
const paths = require('../config/paths')
const checkRequiredFiles = require('react-dev-utils/checkRequiredFiles')
const FileSizeReporter = require('react-dev-utils/FileSizeReporter')
const printHostingInstructions = require('react-dev-utils/printHostingInstructions')

const measureFileSizesBeforeBuild = FileSizeReporter.measureFileSizesBeforeBuild
const printFileSizesAfterBuild = FileSizeReporter.printFileSizesAfterBuild
const hasYarnLock = fs.existsSync(paths.yarnLockFile)

const WARN_AFTER_BUNDLE_GZIP_SIZE = 512 * 1024
const WARN_AFTER_CHUNK_GZIP_SIZE = 1024 * 1024

const isInteractive = process.stdout.isTTY

// Check required files
if (!checkRequiredFiles([paths.appHtml, paths.appIndexJs])) {
  process.exit(1)
}

// Note: --stats flag is handled by the vite.config.js visualizer plugin
let config

const { checkBrowsers } = require('react-dev-utils/browsersHelper')

versioning()
  .then(() => {
    config = configFactory('production')
    checkBrowsers(paths.appPath, isInteractive)
      .then(() => {
        return measureFileSizesBeforeBuild(paths.appBuild)
      })
      .then((previousFileSizes) => {
        fs.emptyDirSync(paths.appBuild)
        copyPublicFolder()
        return buildVite(previousFileSizes)
      })
      .then(({ previousFileSizes }) => {
        console.log(chalk.green('Compiled successfully.\n'))
        console.log('File sizes after gzip:\n')

        // Measure and print file sizes
        return measureFileSizesBeforeBuild(paths.appBuild).then((newFileSizes) => {
          printFileSizesAfterBuild(
            newFileSizes,
            previousFileSizes,
            paths.appBuild,
            WARN_AFTER_BUNDLE_GZIP_SIZE,
            WARN_AFTER_CHUNK_GZIP_SIZE,
          )

          const appPackage = require(paths.appPackageJson)
          const publicUrl = paths.publicUrlOrPath
          const publicPath = config.base
          const buildFolder = path.relative(process.cwd(), paths.appBuild)
          printHostingInstructions(appPackage, publicUrl, publicPath, buildFolder, hasYarnLock)
        })
      })
      .catch((err) => {
        console.log(chalk.red('Failed to compile.\n'))
        console.log((err && err.message) || err)
        console.log()
        process.exit(1)
      })
  })
  .catch((err) => {
    if (err && err.message) {
      console.log(err.message)
    }
    process.exit(1)
  })

async function buildVite(previousFileSizes) {
  console.log('Creating an optimized production build with Vite...')

  await build(config)

  return { previousFileSizes }
}

function copyPublicFolder() {
  fs.copySync(paths.appPublic, paths.appBuild, {
    dereference: true,
    filter: (file) => file !== paths.appHtml,
  })
}
