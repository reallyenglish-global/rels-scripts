#!/usr/bin/env node
'use strict'

const resolveBin = require('./resolveBin')

/**
 * Returns the base Mocha arguments used across all test scripts
 * @param {string[]} additionalArgs - Additional arguments to append
 * @returns {string[]} Array of arguments for spawn
 */
function getMochaArgs(additionalArgs = []) {
  const mochaBin = resolveBin('mocha', 'mocha')

  return [
    mochaBin,
    '--recursive',
    '--timeout',
    '10000',
    ...additionalArgs,
  ]
}

module.exports = getMochaArgs
