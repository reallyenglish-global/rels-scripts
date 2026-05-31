'use strict'

// Vite uses import.meta.env instead of process.env
// This module helps transform env variables for Vite
const getClientEnvironment = require('../env')

function getViteEnv(publicUrl) {
  const env = getClientEnvironment(publicUrl)

  // Transform for Vite's import.meta.env
  // Vite only exposes variables prefixed with VITE_
  // We need to ensure RELS_ variables are available
  const viteEnv = {}

  Object.keys(env.raw).forEach((key) => {
    // Vite automatically includes VITE_ prefixed vars
    // We need to manually add RELS_ and other required vars
    if (key.startsWith('RELS_') || key === 'NODE_ENV' || key === 'PUBLIC_URL') {
      viteEnv[`VITE_${key}`] = env.raw[key]
      // Also add without VITE_ prefix for compatibility
      viteEnv[key] = env.raw[key]
    }
  })

  return viteEnv
}

module.exports = getViteEnv
