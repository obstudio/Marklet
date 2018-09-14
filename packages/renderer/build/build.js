const webpack = require('webpack')
const sfc2js = require('sfc2js').default
const path = require('path')
const fs = require('fs')

function fullPath(name) {
  return path.join(__dirname, '..', name)
}

sfc2js({
  srcDir: fullPath('comp'),
  outDir: fullPath('temp'),
  outCSSFile: '../html/marklet.min.css',
})

fs.copyFileSync(fullPath('html/marklet.min.css'), fullPath('docs/marklet.min.css'))

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
    if (process.argv.includes('--prod')) {
      fs.copyFileSync(fullPath('html/marklet.min.js'), fullPath('docs/marklet.min.js'))
    }
  }
})
