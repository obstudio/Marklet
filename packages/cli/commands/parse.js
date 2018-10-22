const fs = require('fs')
const util = require('../util')
const yaml = require('js-yaml')
const chalk = require('chalk')
const parser = require('@marklet/parser')

function isObject(node) {
  return node === null || typeof node !== 'object'
}

function prettyPrint(node, indent = 0) {
  const space = '  '.repeat(indent)
  if (isObject(node)) {
    if (typeof node === 'string') {
      console.log(chalk.yellowBright(node))
    } else {
      console.log(chalk.cyanBright(node))
    }
  } else if (node instanceof Array) {
    node.forEach((node, index) => {
      if (index) process.stdout.write(space)
      process.stdout.write('- ')
      prettyPrint(node, indent + 1)
    })
  } else {
    let firstLine = !node.type
    if (node.type) {
      console.log(chalk.redBright('\b\b# ' + node.type))
    }
    for (const key in node) {
      if (key === 'type') continue
      if (!firstLine) {
        process.stdout.write(space)
      } else {
        firstLine = false
      }
      process.stdout.write(chalk.magentaBright(key) + ': ')
      if (!isObject(node[key])) {
        process.stdout.write('\n' + space)
        if (node[key] instanceof Array) process.stdout.write('  ')
      }
      prettyPrint(node[key], indent + 1)
    }
  }
}

module.exports = program => program
  .command('parse [filepath]')
  .usage('[options] <filepath>')
  .description('Parse a marklet file into marklet AST.')
  .allowConfig()
  .option('-B, --no-bound', 'prevent from recording token bounds')
  .option('-f, --format [format]', 'set the output format', 'json')
  .option('-i, --indent [length]', 'set the indent length', 2)
  .option('-p, --pretty', 'pretty printed (it overrides all other options)')
  .action(function(filepath = '') {
    const basePath = util.fullPath(filepath)
    util.tryFindFile(filepath, true)
    const indent = this.indent || 2
    const result = parser.parse({
      input: fs.readFileSync(basePath).toString(),
      config: {
        ...this.getConfig(),
        require_bound: this.bound && !this.pretty,
      },
    })
    if (this.pretty) {
      prettyPrint(result)
    } else if (this.format === 'json' || !this.format) {
      console.log(JSON.stringify(result, null, indent))
    } else if (this.format === 'yaml') {
      console.log(yaml.safeDump(result, { indent }))
    } else {
      util.handleError(this.format + ' is not a supported format.')
    }
  })
