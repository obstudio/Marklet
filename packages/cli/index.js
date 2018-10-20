#!/usr/bin/env node

const program = require('./program')
const pj = require('./package.json')

program
  .name('marklet')
  .version(pj.version, '-v, --version')
  .description(pj.description)
  .on('command:*', (cmd) => {
    console.error(`error: invalid command '${cmd}'.`)
    console.log('See --help for a list of available commands.')
    process.exit(1)
  })

program
  .apply(require('./commands/parse'))
  .apply(require('./commands/edit'))
  .apply(require('./commands/watch'))
  .apply(require('./commands/build'))
  .parse(process.argv)
