const webpack = require('webpack')
const sfc2js = require('sfc2js')
const path = require('path')
const fs = require('fs')

function fullPath(name) {
  return path.join(__dirname, '..', name)
}

function mkdirIfNotExists(path) {
  if (!fs.existsSync(path)) {
    fs.mkdirSync(path)
  }
}

mkdirIfNotExists(fullPath('dist'))

sfc2js.install(require('@sfc2js/clean-css'))

sfc2js.transpile({
  srcDir: fullPath('comp'),
  outDir: fullPath('temp'),
  outCSSFile: '../dist/dev.min.css',
  useCache: false,
  defaultScript: {
    props: ['node'],
  },
})

const compiler = webpack({
  target: 'web',
  mode: process.argv.includes('--prod') ? 'production' : 'development',
  entry: path.resolve(__dirname, '../dist/client.js'),
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '../temp')
    }
  },
  output: {
    path: path.resolve(__dirname, '../dist'),
    filename: 'marklet.min.js',
    library: 'Marklet',
    libraryExport: 'Marklet',
    libraryTarget: 'umd'
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
  fs.copyFileSync(fullPath('index.html'), fullPath('dist/index.html'))
  fs.copyFileSync(path.join(path.dirname(require.resolve('@marklet/renderer')), 'marklet.min.css'), fullPath('dist/marklet.min.css'))
})
