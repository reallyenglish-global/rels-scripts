const path = require('path')
require('@babel/register', '@babel/runtime')({
  configFile: path.join(__dirname, '../babel.config.js'),
})
