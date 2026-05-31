'use strict'

// Router script - delegates to webpack or vite based on BUNDLER env var
const bundler = process.env.BUNDLER || 'webpack'

if (bundler === 'vite') {
  console.log('Starting with Vite bundler...\n')
  require('./start-vite')
} else if (bundler === 'webpack') {
  require('./start-webpack')
} else {
  console.error(`Unknown bundler: ${bundler}. Expected 'webpack' or 'vite'.`)
  process.exit(1)
}
