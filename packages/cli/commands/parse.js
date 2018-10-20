const fs = require('fs')
const util = require('../util')
const yaml = require('js-yaml')
const parser = require('@marklet/parser')

module.exports = program => program
  .command('parse [filepath]')
  .usage('[options] <filepath>')
  .description('Parse a marklet file into marklet AST.')
  .allowConfig()
  .option('-f, --format [format]', 'the output format', 'json')
  .action(function(filepath = '') {
    const basePath = util.fullPath(filepath)
    util.tryFindFile(filepath)
    if (!fs.statSync(basePath).isFile()) {
      util.handleError(filepath + ' is not a file.')
    }
    const result = parser.parse({
      input: fs.readFileSync(basePath).toString(),
      config: this.getConfig(),
    })
    switch (this.format || 'json') {
    case 'json':
      console.log(JSON.stringify(result, null, 2))
      break
    case 'yaml':
      console.log(yaml.safeDump(result))
      break
    default:
      util.handleError(this.format + ' is not a supported format.')
    }
  })
