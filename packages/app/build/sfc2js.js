const sfc2js = require('sfc2js')
const sass = require('sass')
const path = require('path')

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

module.exports = sfc2js
