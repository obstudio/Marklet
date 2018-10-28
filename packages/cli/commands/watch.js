const open = require('opn')
const util = require('../util')
const server = require('@marklet/dev-server')

module.exports = program => program
  .command('watch [filepath|dirpath]')
  .description('Watch a marklet file or project.')
  .allowPort()
  .allowConfig()
  .action(function(filepath) {
    const options = this.getOptions()
    options.filepath = util.fullPath(filepath)
    server.watch(options)
    if (this.open) {
      open(`http://localhost:${options.port || 8080}`)
    }
  })
