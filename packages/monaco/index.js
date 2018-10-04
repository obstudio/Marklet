const loader = require('monaco-editor/min/vs/loader')
const isBrowser = typeof window === 'object' && window
const amdRequire = isBrowser ? loader.require : loader
const Marklet = require('./marklet')
const path = require('path')
const fs = require('fs')

function resolveModulePath(filepath) {
  for (const basepath of require.resolve.paths(__dirname)) {
    const fullpath = path.resolve(basepath, filepath)
    if (fs.existsSync(fullpath)) {
      return 'file:///' + fullpath
        .split(path.sep)
        .map(name => name.replace(/#/g, '%23').replace(/ /g, '%20'))
        .join('/')
    }
  }
  throw new Error(`Cannot find module '${filepath}'`)
}

amdRequire.config({
  baseUrl: resolveModulePath('monaco-editor/min')
})

// workaround monaco-css not understanding the environment
if (isBrowser) window.module = undefined

let monaco = null

module.exports = new Promise((resolve, reject) => {
  try {
    amdRequire(['vs/editor/editor.main'], () => {
      monaco = window.monaco
      monaco.languages.register({
        id: 'marklet',
        extensions: ['mkl'],
      })
      monaco.languages.setMonarchTokensProvider('marklet', Marklet)
      resolve(window.monaco)
    })
  } catch (error) {
    reject(error)
  }
})

module.exports.install = async function(Vue) {
  Object.defineProperty(Vue.prototype, '$colorize', {
    get: () => monaco ? (code, lang) => monaco.editor.colorize(code, lang) : undefined
  })
}
