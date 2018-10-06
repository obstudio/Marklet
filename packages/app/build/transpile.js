const sass = require('../../../build/scss')
const util = require('../../../build/util')
const sfc2js = require('../../../build/sfc2js')

util.start()

module.exports = sfc2js.transpile({
  baseDir: util.resolve(),
  srcDir: 'app/comp',
  outDir: 'app/temp',
  enterance: util.isElectron() ? 'app.vue' : '',
})

module.exports.css += sass.loadAll({
  base: 'app',
  src: 'comp/index.scss',
  dest: 'temp/index.css',
}, {
  base: 'renderer',
  src: 'themes/simple.scss',
  dest: 'dist/simple.css',
  selector: '.simple',
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
