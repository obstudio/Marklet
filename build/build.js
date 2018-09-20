const webpack = require('webpack')
const sfc2js = require('sfc2js')
const path = require('path')

function fullPath(name) {
  return path.join(__dirname, '..', name)
}

sfc2js.install(require('@sfc2js/clean-css'))

sfc2js.transpile({
  srcDir: fullPath('comp'),
  outDir: fullPath('temp'),
  outCSSFile: '../html/marklet.min.css',
  useCache: false,
  defaultScript: {
    props: ['node'],
  },
})

const compiler = webpack({
  target: 'web',
  mode: process.argv.includes('--prod') ? 'production' : 'development',
  entry: path.resolve(__dirname, '../html/marklet.js'),
  output: {
    path: path.resolve(__dirname, '../html'),
    filename: 'marklet.min.js'
  },
})

new webpack.ProgressPlugin().apply(compiler)

compiler.run((error, stat) => {
  if (error) {
    console.log(error)
  } else if (stat.compilation.errors.length) {
    console.log(stat.compilation.errors.join('\n'))
  } else {
    console.log('Succeed.')
  }
})
