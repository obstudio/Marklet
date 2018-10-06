const util = require('../../../build/util')
const sass = require('sass')
const fs = require('fs')

function load({
  src,
  dest = src,
  selector,
  base = '',
  cache = dest,
  style = 'compressed',
}) {
  let cacheData = ''
  try {
    cacheData = fs.readFileSync(util.resolve(base, cache + '.cache.scss')).toString()
  } catch (error) { /**/ }

  const source = fs.readFileSync(util.resolve(base, src + '.scss')).toString()
  const srcData = selector ? `${selector}{${source}}` : source

  if (srcData === cacheData && fs.existsSync(util.resolve(dest + '.css'))) {
    return fs.readFileSync(util.resolve(base, dest + '.css')).toString()
  } else {
    const destData = sass.renderSync({ data: srcData, outputStyle: style }).css.toString()
    fs.writeFileSync(util.resolve(base, dest + '.css'), destData)
    fs.writeFileSync(util.resolve(base, cache + '.cache.scss'), srcData)
    return destData
  }
}

function loadAll(...options) {
  return options.map(load).join('')
}

module.exports = {
  load,
  loadAll,
}
