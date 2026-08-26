'use strict'

// Router script - delegates to Vite by default; webpack remains an explicit fallback.
const bundler = process.env.BUNDLER || 'vite'

if (bundler === 'vite') {
  console.log('Building with Vite bundler...\n')
  require('./build-vite')
} else if (bundler === 'webpack') {
  require('./build-webpack')
} else {
  console.error(`Unknown bundler: ${bundler}. Expected 'webpack' or 'vite'.`)
  process.exit(1)
}
