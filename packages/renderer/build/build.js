const webpack = require('webpack')
const fs = require('fs')
const sfc2js = require('sfc2js')
const path = require('path')

function fullPath(name) {
  return path.join(__dirname, '..', name)
}

function mkdirIfNotExists(path) {
  if (!fs.existsSync(path)) {
    fs.mkdirSync(path)
  }
}

mkdirIfNotExists(fullPath('dist'))

sfc2js.install(require('@sfc2js/sass'))
sfc2js.install(require('@sfc2js/clean-css'))

sfc2js.transpile({
  srcDir: fullPath('comp'),
  outDir: fullPath('temp'),
  outCSSFile: '../dist/marklet.min.css',
  useCache: false,
  defaultScript: {
    props: ['node'],
  },
})

const compiler = webpack({
  target: 'web',
  mode: process.argv.includes('--prod') ? 'production' : 'development',
  entry: path.resolve(__dirname, '../src/index.js'),
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '../temp')
    }
  },
  output: {
    path: path.resolve(__dirname, '../dist'),
    filename: 'renderer.min.js',
    library: 'Marklet',
    libraryTarget: 'umd',
    globalObject: 'typeof self !== \'undefined\' ? self : this'
  }
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
