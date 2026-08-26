'use strict'

// Router script - delegates to Vite by default; webpack remains an explicit fallback.
const bundler = process.env.BUNDLER || 'vite'

if (bundler === 'vite') {
  console.log('Starting with Vite bundler...\n')
  require('./start-vite')
} else if (bundler === 'webpack') {
  require('./start-webpack')
} else {
  console.error(`Unknown bundler: ${bundler}. Expected 'webpack' or 'vite'.`)
  process.exit(1)
}
