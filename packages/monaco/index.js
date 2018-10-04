const loader = require('monaco-editor/min/vs/loader')
const isBrowser = typeof window === 'object' && window
const amdRequire = isBrowser ? loader.require : loader
const onLoad = require('./dist/main').default
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

module.exports = amdRequire(['vs/editor/editor.main'], onLoad)
