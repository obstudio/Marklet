#!/usr/bin/env node

const fs = require('fs')
const open = require('opn')
const path = require('path')
const chalk = require('chalk')
const yaml = require('js-yaml')
const program = require('commander')
const pj = require('./package.json')
const parser = require('@marklet/parser')
const server = require('@marklet/dev-server')

const JS_TYPES = ['.json', '.js']
const YAML_TYPES = ['.yml', '.yaml']
const ALL_TYPES = [
  ...JS_TYPES,
  ...YAML_TYPES,
]

function handleError(message) {
  console.error(chalk.redBright('error:'), message)
  process.exit(1)
}

function tryFindFile(filepath) {
  if (fs.existsSync(path.resolve(process.cwd(), filepath))) return
  if (!filepath) {
    handleError('a filepath is required.')
  } else {
    handleError(`file ${filepath} was not found.`)
  }
}

function isFileExist(filepath) {
  if (!fs.existsSync(filepath)) return false
  return fs.statSync(filepath).isFile()
}

function loadFromFile(filepath) {
  const ext = path.extname(filepath)
  if (YAML_TYPES.includes(ext)) {
    return yaml.safeLoad(fs.readFileSync(filepath).toString())
  } else if (JS_TYPES.includes(ext)) {
    return require(filepath)
  } else if (ext) {
    throw new Error(`error: cannot recognize file extension '${ext}'.`)
  } else {
    throw new Error('error: cannot recognize file with no extenstion.')
  }
}

Object.assign(Object.getPrototypeOf(program), {
  allowConfig() {
    this._allowConfig = true
    return this
      .option('-l, --default-lang [lang]', 'Default language in code block', '')
      .option('-H, --no-header-align', 'Disable header to align at center')
      .option('-S, --no-section', 'Disallow section syntax')
  },
  allowPort() {
    this._allowPort = true
    return this
      .option('-o, --open', 'open in the default browser')
      .option('-p, --port [port]', 'port for the development server', parseInt)
  },
  getConfig() {
    return {
      header_align: this.headerAlign,
      allow_section: this.section,
      default_language: this.defaultLang,
    }
  },
  getOptions(filepath = '', forced = true) {
    filepath = path.resolve(filepath)
    let basePath = path.resolve(process.cwd(), filepath)
    let options = {}
    try {
      tryFindFile(filepath)
      if (fs.statSync(basePath).isFile()) {
        options = loadFromFile(basePath)
      } else {
        let matchFound = false
        basePath = path.join(basePath, 'marklet')
        for (const type of ALL_TYPES) {
          if (isFileExist(basePath + type)) {
            options = loadFromFile(basePath + type)
            matchFound = true
            break
          }
        }
        if (!matchFound && forced) {
          throw new Error(`no config file was found in ${basePath}.`)
        }
      }
      if (this._allowPort) {
        if (this.port) options.port = this.port
      }
      if (this._allowConfig) {
        if (!options.config) options.config = {}
        Object.assign(options.config, this.getConfig())
      }
    } catch (error) {
      handleError(error.message)
    }
    return options
  }
})

program
  .name('marklet')
  .version(pj.version, '-v, --version')
  .description(pj.description)

program
  .command('parse [filepath]')
  .usage('<filepath>')
  .description('Parse a marklet file into marklet AST.')
  .allowConfig()
  .action(function(filepath = '') {
    const basePath = path.resolve(process.cwd(), filepath)
    tryFindFile(filepath)
    if (!fs.statSync(basePath).isFile()) {
      handleError(filepath + ' is not a file.')
    }
    console.log(JSON.stringify(parser.parse({
      input: fs.readFileSync(basePath).toString(),
      config: this.getConfig(),
    }), null, 2))
  })

program
  .command('build [filepath|dirpath]')
  .description('Build a marklet project into a website.')
  // .option('-s, --source [path]', 'Read text from file')
  // .option('-i, --input [text]', 'Read text directly from stdin', '')
  // .option('-d, --dest [path]', 'Write parsed data to file instead of stdin')
  .allowConfig()
  .action(function(filepath = '') {
    const options = this.getOptions(filepath)
    console.log(options)
  })

program
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

program
  .command('watch [filepath|dirpath]')
  .description('Watch a marklet file or project.')
  .allowPort()
  .allowConfig()
  .action(function(filepath = '') {
    const options = this.getOptions(filepath)
    server.watch(options)
    if (this.open) {
      open(`http://localhost:${options.port || 8080}`)
    }
  })

program.on('command:*', (cmd) => {
  console.error(`error: invalid command '${cmd}'.`)
  console.log('See --help for a list of available commands.')
  process.exit(1)
})

program.parse(process.argv)
