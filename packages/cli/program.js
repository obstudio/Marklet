const program = require('commander')
const { DEFAULT_PORT } = require('@marklet/dev-server')

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
  getOptions() {
    let options = {}
    if (this._allowPort) {
      if (this.port) options.port = this.port
    }
    if (this._allowConfig) {
      if (!options.parseOptions) options.parseOptions = {}
      Object.assign(options.parseOptions, this.getConfig())
    }
    return options
  },
})

program._optionHooks = []

module.exports = program
