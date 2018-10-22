const open = require('opn')
const server = require('@marklet/dev-server')

module.exports = program => program
  .command('edit [filepath|dirpath]')
  .description('Edit a marklet file or project.')
  .allowPort()
  .allowConfig()
  .action(function(filepath = '') {
    const options = this.getOptions(filepath, false)
    server.edit(options)
    if (this.open) {
      open(`http://localhost:${options.port || 8080}`)
    }
  })
