const util = require('./util')
const { minify } = require('html-minifier')
const program = require('commander')
const webpack = require('webpack')
const sfc2js = require('sfc2js')
const fs = require('fs')

sfc2js.install(require('@sfc2js/sass'))
sfc2js.install(require('@sfc2js/clean-css'))

function mkdirIfNotExists(name) {
  fs.existsSync(util.resolve(name)) || fs.mkdirSync(util.resolve(name))
}

program
  .option('-d, --dev')
  .option('-p, --prod')
  .option('-r, --renderer')
  .option('-s, --server')
  .option('-t, --tsc')
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
    entry: util.resolve(name, options.entry),
    resolve: {
      alias: {
        '@': util.resolve(name, 'temp')
      }
    },
    output: {
      path: util.resolve(name, 'dist'),
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
    resolve()
  })
})

Promise.resolve().then(() => {
  if (program.renderer) {
    mkdirIfNotExists('renderer/dist')

    sfc2js.transpile({
      ...sfc2jsOptions,
      baseDir: util.resolve('renderer'),
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
  
    if (program.tsc) {
      util.exec('tsc -p packages/dev-server')
    }

    if (program.prod) {
      fs.writeFileSync(
        util.resolve('dev-server/dist/index.html'),
        minify(fs.readFileSync(util.resolve('dev-server/src/index.html')).toString(), {
          collapseWhitespace: true,
          removeAttributeQuotes: true,
        })
      )
    } else {
      fs.copyFileSync(
        util.resolve('dev-server/src/index.html'),
        util.resolve('dev-server/dist/index.html')
      )
    }
  
    sfc2js.transpile({
      ...sfc2jsOptions,
      baseDir: util.resolve('dev-server'),
      outCSSFile: '../dist/client.min.css',
    })

    return bundle('dev-server', {
      entry: 'dist/client.js',
      output: 'client.min.js',
      libraryExport: 'Marklet',
    })
  }
}).catch((error) => {
  console.log(error)
})
