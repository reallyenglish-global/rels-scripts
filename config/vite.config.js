'use strict'

const path = require('path')
const fs = require('fs')
const { defineConfig } = require('vite')
const react = require('@vitejs/plugin-react')
const svgr = require('vite-plugin-svgr')
const handlebars = require('vite-plugin-handlebars')
const { visualizer } = require('rollup-plugin-visualizer')
const { VitePWA } = require('vite-plugin-pwa')
const getClientEnvironment = require('./env')
const paths = require('./paths')
const getHttpsConfig = require('./getHttpsConfig')
const { relsAssetsPlugin, htmlInterpolationPlugin } = require('./vite/plugins')

module.exports = function (mode) {
  const isEnvDevelopment = mode === 'development'
  const isEnvProduction = mode === 'production'

  // Get environment variables
  const env = getClientEnvironment(paths.publicUrlOrPath.slice(0, -1))

  // Get HTTPS config (reuse webpack logic)
  const httpsConfig = getHttpsConfig()

  return defineConfig({
    mode,
    root: paths.appPath,
    base: paths.publicUrlOrPath,

    // Development server config
    server: {
      port: parseInt(process.env.PORT, 10) || 3000,
      host: process.env.HOST || '0.0.0.0',
      https: httpsConfig,
      open: false,
      cors: true,
      hmr: process.env.RELS_HMR === 'true',
    },

    // Build config
    build: {
      outDir: paths.appBuild,
      assetsDir: 'static',
      sourcemap: process.env.GENERATE_SOURCEMAP !== 'false',
      minify: isEnvProduction ? 'terser' : false,
      chunkSizeWarningLimit: 1024, // Match webpack's WARN_AFTER_CHUNK_GZIP_SIZE
      rollupOptions: {
        output: {
          manualChunks: undefined,
          assetFileNames: 'static/media/[name].[hash].[ext]',
          chunkFileNames: 'static/js/[name].[hash].js',
          entryFileNames: 'static/js/[name].[hash].js',
        },
      },
    },

    // Resolve config
    resolve: {
      extensions: ['.js', '.json', '.jsx', '.ts', '.tsx'],
      alias: {
        // Add any webpack aliases from modules.webpackAliases if needed
      },
    },

    // CSS config
    css: {
      modules: {
        localsConvention: 'camelCase',
        generateScopedName: isEnvProduction
          ? '[hash:base64:8]'
          : '[path][name]__[local]--[hash:base64:5]',
      },
      preprocessorOptions: {
        scss: {
          // Match webpack's SASS_OPTIONS
          ...(process.env.SASS_OPTIONS && JSON.parse(process.env.SASS_OPTIONS)),
        },
      },
      postcss: {
        plugins: [
          require('postcss-flexbugs-fixes'),
          require('postcss-preset-env')({
            autoprefixer: {
              flexbox: 'no-2009',
            },
            stage: 3,
          }),
          require('postcss-normalize')(),
        ],
      },
    },

    // Define environment variables
    define: env.stringified['process.env'],

    // Plugins
    plugins: [
      react({
        babel: {
          configFile: path.resolve(__dirname, '../babel.config.js'),
        },
      }),

      // SVG as React components (match @svgr/webpack behavior)
      svgr({
        svgrOptions: {
          prettier: false,
          svgo: false,
          svgoConfig: {
            plugins: [{ removeViewBox: false }],
          },
          titleProp: true,
          ref: true,
        },
      }),

      // Handlebars support
      handlebars({
        // Match handlebars-loader behavior
      }),

      // RELS-specific plugins
      relsAssetsPlugin(),
      htmlInterpolationPlugin(env.raw),

      // Service worker support (production only, if src/service-worker.js exists)
      isEnvProduction &&
        fs.existsSync(paths.swSrc) &&
        VitePWA({
          strategies: 'injectManifest',
          srcDir: path.dirname(paths.swSrc),
          filename: path.basename(paths.swSrc),
          injectManifest: {
            maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
          },
        }),

      // Bundle analyzer (production only, when stats requested)
      isEnvProduction &&
        process.argv.includes('--stats') &&
        visualizer({
          filename: path.join(paths.appBuild, 'bundle-stats.html'),
          open: false,
        }),
    ].filter(Boolean),

    // Public directory
    publicDir: paths.appPublic,
  })
}
