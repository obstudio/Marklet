const util = require('../../../build/util')
const sass = require('sass')
const path = require('path')
const sfc2js = require('sfc2js')

util.start()

sfc2js.install({
  name: 'sass-plugin',
  version: '1.0',
  target: 'style',
  lang: [
    'sass',
    'scss',
    'css',
  ],
  default: {
    includePaths: [],
  },
  updated(options) {
    const dirPath = path.dirname(options.srcPath)
    this.options.includePaths.push(dirPath)
  },
  render(style) {
    return sass.renderSync({ ...this.options, data: style.content }).css.toString()
  },
})

module.exports = sfc2js.transpile({
  baseDir: util.resolve(),
  srcDir: 'app/comp',
  outDir: 'app/temp',
  enterance: util.isElectron() ? 'app.vue' : '',
})

if (util.isElectron()) {
  const result = sfc2js.transpile({
    baseDir: util.resolve(),
    srcDir: 'renderer/comp',
    outDir: 'renderer/temp',
    enterance: '../src',
    outCSSFile: '../dist/marklet.min.css',
    defaultScript: {
      props: ['node'],
    },
  })
  module.exports.css += result.css
  module.exports.plugin = result.app
}

console.log('Transpile Succeed.', util.finish())
