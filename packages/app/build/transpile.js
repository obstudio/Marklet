const util = require('../../../build/util')
const sfc2js = require('./sfc2js')
const scss = require('./scss')
const yaml = require('js-yaml')
const fs = require('fs')

util.start()

module.exports = sfc2js.transpile({
  baseDir: util.resolve(),
  srcDir: 'app/comp',
  outDir: 'app/temp',
  enterance: util.isElectron() ? 'app.vue' : '',
})

module.exports.css += scss.loadAll({
  base: 'renderer',
  src: 'themes/simple/index',
  dest: 'dist/simple',
  selector: '.simple',
}, {
  base: 'renderer',
  src: 'themes/dark/index',
  dest: 'dist/dark',
  selector: '.dark',
}, {
  base: 'monaco',
  src: 'index',
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

  module.exports.themes = {
    dark: yaml.safeLoad(fs.readFileSync(util.resolve('renderer/themes/dark/monaco.yaml'))),
    simple: yaml.safeLoad(fs.readFileSync(util.resolve('renderer/themes/simple/monaco.yaml'))),
  }

  module.exports.css += result.css
  module.exports.plugin = result.app
}

console.log('Transpile Succeed.', util.finish())
