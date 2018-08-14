const vtc = require('vue-template-compiler')
const sass = require('sass')
const path = require('path')
const fs = require('fs')

function fullPath(name) {
  return path.join(__dirname, '..', name)
}

function getRandomId() {
  const id = Math.floor(Math.random() * 36 ** 6).toString(36)
  return ' '.repeat(6 - id.length) + id
}

let css = ''

fs.readdirSync(fullPath('comp'))
  .filter(name => name.endsWith('.vue'))
  .forEach(name => {
    const compPath = fullPath('comp/' + name)
    const distPath = fullPath('dist/' + name)
    const id = getRandomId()

    const {
      script: { content: js },
      template: { content: html },
      styles: [{ content: scss }],
    } = vtc.parseComponent(fs.readFileSync(compPath, { encoding: 'utf8' }))

    const {
      render,
      staticRenderFns: fns,
    } = vtc.compileToFunctions(html)

    fs.writeFileSync(distPath.slice(0, -4) + '.js', js)
    fs.writeFileSync(distPath + '.js', `
      const data = require('./${distPath.match(/[/\\]([^/\\]+)\.vue$/)[1]}');
      (data.mixins || (data.mixins = [])).push({ mounted() { this.$el.setAttribute('id-${id}', '') } });
      module.exports = { ...data, render: ${render}, staticRenderFns: [${fns.join(',')}] };
    `)

    css += sass.renderSync({ data: `[id-${id}]{${scss}}`, outputStyle: 'compressed' }).css
  })

fs.writeFileSync(fullPath('html/app.dist.css'), css)
