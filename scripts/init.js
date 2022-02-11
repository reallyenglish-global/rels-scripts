const args = process.argv.slice(2)

if (args.includes('--no-hooks') === false) {
  require('./hooks')
}

if (args.includes('--no-vscode') === false) {
  require('./vscode')
}
