const webpack = require('webpack')
const program = require('commander')
const sfc2js = require('sfc2js')
const path = require('path')
const fs = require('fs')

sfc2js.install(require('@sfc2js/sass'))
sfc2js.install(require('@sfc2js/clean-css'))

function fullPath(...names) {
  return path.join(__dirname, '../packages', ...names)
}

function mkdirIfNotExists(name) {
  fs.existsSync(fullPath(name)) || fs.mkdirSync(fullPath(name))
}

program
  .option('-d, --dev')
  .option('-p, --prod')
  .option('-r, --renderer')
  .option('-s, --server')
  .parse(process.argv)

const env = program.prod ? 'production' : 'development'

const sfc2jsOptions = {
  srcDir: 'comp',
  outDir: 'temp',
}

const bundle = (name, options) => new Promise((resolve, reject) => {
  const compiler = webpack({
    target: 'web',
    mode: env,
    entry: fullPath(name, options.entry),
    resolve: {
      alias: {
        '@': fullPath(name, 'temp')
      }
    },
    output: {
      path: fullPath(name, 'dist'),
      filename: options.output,
      library: 'Marklet',
      libraryTarget: 'umd',
      libraryExport: options.libraryExport,
      globalObject: 'typeof self !== \'undefined\' ? self : this'
    }
  })
  
  new webpack.ProgressPlugin().apply(compiler)
  
  compiler.run((error, stat) => {
    if (error) {
      console.log(error)
      reject()
    } else if (stat.compilation.errors.length) {
      console.log(stat.compilation.errors.join('\n'))
      reject()
    } else {
      console.log('Bundle Succeed.')
    }
    if (options.callback) {
      options.callback((...names) => fullPath(name, ...names))
    }
    resolve()
  })
})

Promise.resolve().then(() => {
  if (program.renderer) {
    mkdirIfNotExists('renderer/dist')
  
    sfc2js.transpile({
      ...sfc2jsOptions,
      baseDir: fullPath('renderer'),
      outCSSFile: '../dist/marklet.min.css',
      defaultScript: {
        props: ['node'],
      },
    })

    return bundle('renderer', {
      entry: 'src/index.js',
      output: 'renderer.min.js',
    })
  }
}).then(() => {
  if (program.server) {
    mkdirIfNotExists('dev-server/dist')
  
    sfc2js.transpile({
      ...sfc2jsOptions,
      baseDir: fullPath('dev-server'),
      outCSSFile: '../dist/dev.min.css',
    })

    return bundle('dev-server', {
      entry: 'dist/client.js',
      output: 'marklet.min.js',
      libraryExport: 'Marklet',
      callback(relPath) {
        fs.copyFileSync(relPath('index.html'), relPath('dist/index.html'))
        fs.copyFileSync(fullPath('renderer/dist/marklet.min.css'), relPath('dist/marklet.min.css'))  
      }
    })
  }
})
