const util = require('./util')
const sass = require('sass')
const fs = require('fs')

function load({
  src,
  dest,
  selector,
  base = '',
  cache = dest.slice(0, -3) + 'cache.scss',
}) {
  let cacheData = ''
  try {
    cacheData = fs.readFileSync(util.resolve(base, cache)).toString()
  } catch (error) { /**/ }

  const source = fs.readFileSync(util.resolve(base, src)).toString()
  const srcData = selector ? `${selector}{${source}}` : source

  if (srcData === cacheData && fs.existsSync(util.resolve(dest))) {
    return fs.readFileSync(util.resolve(base, dest)).toString()
  } else {
    const destData = sass.renderSync({ data: srcData }).css.toString()
    fs.writeFileSync(util.resolve(base, dest), destData)
    fs.writeFileSync(util.resolve(base, cache), srcData)
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
