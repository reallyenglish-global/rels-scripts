'use strict'

process.env.BABEL_ENV = 'development'
process.env.NODE_ENV = 'development'

process.on('unhandledRejection', (err) => {
  throw err
})
const chalk = require('react-dev-utils/chalk')
const webpack = require('webpack')
const WebpackDevServer = require('webpack-dev-server')
const clearConsole = require('react-dev-utils/clearConsole')
const checkRequiredFiles = require('react-dev-utils/checkRequiredFiles')
/* eslint-disable object-curly-newline */
const {
  choosePort,
  createCompiler,
  prepareProxy,
  prepareUrls,
} = require('react-dev-utils/WebpackDevServerUtils')
const openBrowser = require('react-dev-utils/openBrowser')
const {
  appHtml,
  appPath,
  appIndexJs,
  publicUrlOrPath,
  appPackageJson,
  appPublic,
} = require('../config/paths')

const configFactory = require('../config/webpack.config')
const createDevServerConfig = require('../config/webpackDevServer.config')
const isInteractive = process.stdout.isTTY
// Warn and crash if required files are missing
if (!checkRequiredFiles([appHtml, appIndexJs])) {
  process.exit(1)
}

const PORT = parseInt(process.env.PORT, 10) || 3000
const HOST = process.env.HOST || '0.0.0.0'
if (process.env.HOST) {
  console.log(
    chalk.cyan(
      `Attempting to bind to HOST environment variable: ${chalk.yellow(
        chalk.bold(process.env.HOST),
      )}`,
    ),
  )
  console.log(`If this was unintentional, check that you haven't mistakenly set it in your shell.`)
  console.log()
}
const { checkBrowsers } = require('react-dev-utils/browsersHelper')
checkBrowsers(appPath, isInteractive)
  .then(() => {
    return choosePort(HOST, PORT)
  })
  .then((port) => {
    const config = configFactory(process.env.NODE_ENV)
    const protocol = 'https' // process.env.HTTPS === true ? 'https' : 'http'
    const appName = require(appPackageJson).name
    const urls = prepareUrls(protocol, HOST, PORT, publicUrlOrPath.slice(0, -1))

    const compiler = createCompiler({
      appName,
      config,
      urls,
      webpack,
    })

    const proxySetting = require(appPackageJson).proxy
    const proxyConfig = prepareProxy(proxySetting, appPublic, publicUrlOrPath)

    const serverConfig = {
      ...createDevServerConfig(proxyConfig, urls.lanUrlForConfig),
      host: HOST,
      port,
    }

    const devServer = new WebpackDevServer(serverConfig, compiler)

    devServer.startCallback(() => {
      if (isInteractive) {
        clearConsole()
      }
      console.log(chalk.cyan('Starting the development server...\n'))
      openBrowser(urls.localUrlForBrowser)
    })
    ;[('SIGINT', 'SIGTERM')].forEach(function (sig) {
      process.on(sig, function () {
        devServer.close()
        process.exit()
      })
    })

    if (process.env.CI !== 'true') {
      // Gracefully exit when stdin ends
      process.stdin.on('end', function () {
        devServer.close()
        process.exit()
      })
    }
  })
  .catch((err) => {
    if (err && err.message) {
      console.log(err.message)
    }
    process.exit(1)
  })
