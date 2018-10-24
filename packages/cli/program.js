const fs = require('fs')
const path = require('path')
const yaml = require('js-yaml')
const util = require('./util')
const program = require('commander')
const { DEFAULT_PORT } = require('@marklet/dev-server')

const JS_TYPES = ['.json', '.js']
const YAML_TYPES = ['.yml', '.yaml']
const MARK_TYPES = ['.mkl', '.md']
const ALL_TYPES = [
  ...JS_TYPES,
  ...YAML_TYPES,
]

function loadFromFile(filepath) {
  let options
  const ext = path.extname(filepath)
  if (YAML_TYPES.includes(ext)) {
    options = yaml.safeLoad(fs.readFileSync(filepath).toString())
  } else if (JS_TYPES.includes(ext)) {
    options = require(filepath)
  } else if (ext) {
    throw new Error(`error: cannot recognize file extension '${ext}'.`)
  } else {
    throw new Error('error: cannot recognize file with no extenstion.')
  }
  options.sourceType = 'folder'
  return options
}

Object.assign(Object.getPrototypeOf(program), {
  apply(install) {
    install(program)
    return program
  },
  allowConfig() {
    this._allowConfig = true
    return this
      .option('-l, --language [lang]', 'default language in codeblocks', '')
      .option('-H, --no-header-align', 'disable header to align at center')
      .option('-S, --no-section', 'disallow section syntax')
  },
  allowPort() {
    this._allowPort = true
    return this
      .option('-o, --open', 'show in browser when connection is established')
      .option('-p, --port [port]', 'port for the development server', parseInt, DEFAULT_PORT)
  },
  getConfig() {
    const config = {}
    if (!this.headerAlign) config.header_align = false
    if (!this.section) config.allow_section = false
    if (this.language) config.default_language = this.language
    return config
  },
  getOptions(filepath = '', forced = true) {
    filepath = path.resolve(filepath)
    let basePath = path.resolve(process.cwd(), filepath)
    let options = { sourceType: 'file' }
    try {
      util.tryFindFile(filepath)
      if (fs.statSync(basePath).isFile()) {
        if (!MARK_TYPES.includes(path.extname(basePath))) {
          options = loadFromFile(basePath)
        }
        options.filepath = basePath
      } else {
        let matchFound = false
        basePath = path.join(basePath, 'marklet')
        for (const type of ALL_TYPES) {
          const filename = basePath + type
          if (!fs.existsSync(filename)) continue
          if (fs.statSync(filename).isFile()) {
            options = loadFromFile(basePath)
            options.filepath = basePath
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
      util.handleError(error.message)
    }
    return options
  }
})

module.exports = program
