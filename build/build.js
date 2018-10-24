const themes = require('../packages/renderer/themes')
const { minify } = require('html-minifier')
const program = require('commander')
const webpack = require('webpack')
const sfc2js = require('sfc2js')
const sass = require('node-sass')
const yaml = require('js-yaml')
const util = require('./util')
const fs = require('fs')

sfc2js.install(require('@sfc2js/node-sass'))
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
      library: 'marklet',
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
  if (!program.renderer) return
  mkdirIfNotExists('renderer/dist')

  let css = ''
  return sfc2js.transpile({
    ...sfc2jsOptions,
    baseDir: util.resolve('renderer'),
    outCSSFile: '../dist/marklet.min.css',
    defaultScript: {
      props: ['node'],
    },
  }).then((result) => {
    if (result.errors.length) throw result.errors.join('\n')
    return Promise.all(themes.map(({ key }) => new Promise((resolve, reject) => {
      const filepath = util.resolve('renderer/themes', key + '.scss')
      sass.render({
        data: `.${key}.marklet{${fs.readFileSync(filepath).toString()}}`,
        outputStyle: 'compressed',
      }, (error, result) => {
        if (error) {
          reject(error)
        } else {
          css += result.css.toString()
          resolve()
        }
      })
    })))
  }).then(() => {
    fs.writeFileSync(util.resolve('renderer/dist/themes.min.css'), css)
    return bundle('renderer', {
      entry: 'src/index.js',
      output: 'renderer.min.js',
    })
  })
}).then(() => {
  if (!program.server) return
  mkdirIfNotExists('dev-server/dist')
  mkdirIfNotExists('dev-server/dist/themes')

  if (program.tsc) {
    util.exec('tsc -p packages/dev-server')
  }

  function minifyHTML(src, dist) {
    const srcPath = util.resolve(`dev-server/${src}/index.html`)
    const distPath = util.resolve(`dev-server/${dist}/index.html`)
    if (program.prod) {
      fs.writeFileSync(
        distPath,
        minify(fs.readFileSync(srcPath).toString(), {
          collapseWhitespace: true,
          removeAttributeQuotes: true,
        })
      )
    } else {
      fs.copyFileSync(srcPath, distPath)
    }
  }

  minifyHTML('server', 'dist')

  let css = ''
  
  return sfc2js.transpile({
    ...sfc2jsOptions,
    useCache: false,
    baseDir: util.resolve('dev-server'),
    outCSSFile: '../dist/client.min.css',
  }).then((result) => {
    if (result.errors.length) throw result.errors.join('\n')
    return Promise.all(themes.map(({ key }) => new Promise((resolve, reject) => {
      const filepath = util.resolve('dev-server/themes/' + key)
      const distpath = util.resolve('dev-server/dist/themes/' + key)

      try {
        const options = yaml.safeLoad(fs.readFileSync(filepath + '.yaml'))
        fs.writeFileSync(distpath + '.json', JSON.stringify(options))
      } catch (error) {
        reject(error)
      }

      sass.render({
        data: `.${key}.marklet{${fs.readFileSync(filepath + '.scss')}}`,
        outputStyle: 'compressed',
      }, (error, result) => {
        if (error) {
          reject(error)
        } else {
          css += result.css
          resolve()
        }
      })
    })))
  }).then(() => {
    fs.writeFileSync(util.resolve('dev-server/dist/themes.min.css'), css)
    return new Promise((resolve, reject) => {
      sass.render({
        data: fs.readFileSync(util.resolve('dev-server/client/monaco.scss')).toString(),
        outputStyle: 'compressed',
      }, (error, result) => {
        if (error) reject(error)
        fs.writeFileSync(util.resolve('dev-server/dist/monaco.min.css'), result.css)
        resolve()
      })
    })
  }).then(() => bundle('dev-server', {
    entry: 'dist/client/index.js',
    output: 'client.min.js',
    libraryExport: 'default',
  }))
}).catch((error) => {
  console.log(error)
})
