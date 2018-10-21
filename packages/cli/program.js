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
      .option('-o, --open', 'open in the default browser')
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
    let options = { sourceType: 'project' }
    try {
      util.tryFindFile(filepath)
      if (fs.statSync(basePath).isFile()) {
        if (!MARK_TYPES.includes(path.extname(basePath))) {
          Object.assign(options, loadFromFile(basePath))
        } else {
          options.sourceType = 'file'
        }
      } else {
        let matchFound = false
        basePath = path.join(basePath, 'marklet')
        for (const type of ALL_TYPES) {
          const filename = basePath + type
          if (!fs.existsSync(filename)) continue
          if (fs.statSync(filename).isFile()) {
            Object.assign(options, loadFromFile(filename))
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
