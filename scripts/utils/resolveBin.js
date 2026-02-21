'use strict'

const fs = require('fs')
const path = require('path')

module.exports = function resolveBin(packageName, binName) {
  const packageJsonPath = require.resolve(`${packageName}/package.json`)
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'))
  const { bin } = packageJson

  let relativeBin

  if (typeof bin === 'string') {
    relativeBin = bin
  } else if (bin && binName && bin[binName]) {
    relativeBin = bin[binName]
  } else if (bin && bin[packageName]) {
    relativeBin = bin[packageName]
  } else if (bin && Object.keys(bin).length > 0) {
    relativeBin = bin[Object.keys(bin)[0]]
  }

  if (!relativeBin) {
    throw new Error(`Unable to resolve binary for package '${packageName}'`)
  }

  return path.join(path.dirname(packageJsonPath), relativeBin)
}
