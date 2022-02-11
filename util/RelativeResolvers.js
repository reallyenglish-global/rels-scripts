const path = require('path')
const resolveApp = (relativePath) => path.resolve(appDirectory, relativePath)

// Resolve file paths in the same order as webpack
const resolveModule = (resolveFn, filePath) => {
  const extension = moduleFileExtensions.find((extension) =>
    fs.existsSync(resolveFn(`${filePath}.${extension}`)),
  )

  if (extension) {
    return resolveFn(`${filePath}.${extension}`)
  }

  return resolveFn(`${filePath}.js`)
}

const resolveOwn = (relativePath) => path.resolve(__dirname, '..', relativePath)

module.exports = {
  resolveApp,
  resolveModule,
  resolveOwn,
}
