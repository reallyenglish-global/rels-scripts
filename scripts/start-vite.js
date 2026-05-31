'use strict'

process.env.BABEL_ENV = 'development'
process.env.NODE_ENV = 'development'

process.on('unhandledRejection', (err) => {
  throw err
})

const chalk = require('react-dev-utils/chalk')
const checkRequiredFiles = require('react-dev-utils/checkRequiredFiles')
const { createServer } = require('vite')
const configFactory = require('../config/vite.config')
const { appHtml, appIndexJs, appPath, appPackageJson } = require('../config/paths')
const { checkBrowsers } = require('react-dev-utils/browsersHelper')

// Check required files
if (!checkRequiredFiles([appHtml, appIndexJs])) {
  process.exit(1)
}

const PORT = parseInt(process.env.PORT, 10) || 3000
const HOST = process.env.HOST || '0.0.0.0'

const isInteractive = process.stdout.isTTY

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

checkBrowsers(appPath, isInteractive)
  .then(async () => {
    console.log(chalk.cyan('Starting Vite development server...\n'))

    const config = configFactory('development')

    // Read proxy from package.json
    const appPackage = require(appPackageJson)
    if (appPackage.proxy) {
      config.server.proxy = appPackage.proxy
    }

    const server = await createServer(config)
    await server.listen(PORT, HOST)

    server.printUrls()

    console.log(chalk.cyan('\nVite dev server is running.\n'))
    console.log(`  ${chalk.bold('Local:')}   https://localhost:${PORT}`)
    console.log(`  ${chalk.bold('Network:')} https://${HOST}:${PORT}`)
    console.log()

    // Graceful shutdown
    ;['SIGINT', 'SIGTERM'].forEach((sig) => {
      process.on(sig, () => {
        server.close()
        process.exit()
      })
    })
  })
  .catch((err) => {
    if (err && err.message) {
      console.log(err.message)
    }
    process.exit(1)
  })
