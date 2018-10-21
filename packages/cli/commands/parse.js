const fs = require('fs')
const util = require('../util')
const yaml = require('js-yaml')
const chalk = require('chalk')
const parser = require('@marklet/parser')

function printNode(node, indent = 2, back = 1) {
  const space = ' '.repeat(indent - 2 * back)
  const prefix = '- '.repeat(back)
  if (typeof node === 'string') {
    return console.log(prefix + chalk.yellow(node))
  } else if (node instanceof Array) {
    return node.forEach((node, index) => {
      if (node instanceof Array) {
        printNode(node, indent + 2, back + 1)
      } else {
        process.stdout.write(space + '  '.repeat(index ? back : 1))
        printNode(node, indent + 2, index ? 1 : back)
      }
    })
  }
  let firstLine = !node.type
  if (node.type) {
    console.log(chalk.greenBright('# ' + node.type))
  }
  for (const key in node) {
    if (key === 'type') continue
    if (firstLine) {
      process.stdout.write(prefix)
      firstLine = false
    } else {
      process.stdout.write(space + '  ')
    }
    process.stdout.write(chalk`{cyanBright ${key}}: `)
    if (typeof node[key] === 'string') {
      console.log(chalk.yellow(node[key]))
    } else if (typeof node[key] !== 'object') {
      console.log(chalk.magentaBright(node[key]))
    } else {
      process.stdout.write('\n')
      if (node[key] instanceof Array) {
        printNode(node[key], indent + 2 * back, 1)
      } else {
        process.stdout.write(space + '    ')
        printNode(node[key], indent + 2 * back - 2, 0)
      }
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
      result.forEach(node => printNode(node))
      return
    }
    switch (this.format || 'json') {
    case 'json':
      console.log(JSON.stringify(result, null, indent))
      break
    case 'yaml':
      console.log(yaml.safeDump(result, { indent }))
      break
    default:
      util.handleError(this.format + ' is not a supported format.')
    }
  })
