'use strict'

// Router script - delegates to webpack or vite based on BUNDLER env var
const bundler = process.env.BUNDLER || 'webpack'

if (bundler === 'vite') {
  console.log('Building with Vite bundler...\n')
  require('./build-vite')
} else if (bundler === 'webpack') {
  require('./build-webpack')
} else {
  console.error(`Unknown bundler: ${bundler}. Expected 'webpack' or 'vite'.`)
  process.exit(1)
}
