'use strict'

const path = require('path')
const fs = require('fs')

// Custom plugin to handle rels-assets serving
function relsAssetsPlugin() {
  return {
    name: 'rels-assets',
    configureServer(server) {
      const assetsPath = path.resolve(process.cwd(), 'node_modules/rels-assets/assets')
      if (fs.existsSync(assetsPath)) {
        server.middlewares.use('/rels-assets', (req, res, next) => {
          req.url = req.url.replace('/rels-assets', '')
          next()
        })
      }
    },
  }
}

// Custom plugin to handle HTML interpolation (like InterpolateHtmlPlugin)
function htmlInterpolationPlugin(env) {
  return {
    name: 'html-interpolation',
    transformIndexHtml(html) {
      return html.replace(/%PUBLIC_URL%/g, env.PUBLIC_URL || '')
    },
  }
}

module.exports = {
  relsAssetsPlugin,
  htmlInterpolationPlugin,
}
