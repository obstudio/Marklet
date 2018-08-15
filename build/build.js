const {
  parseComponent,
  compileToFunctions,
} = require('vue-template-compiler')

const webpack = require('webpack')
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
    name = name.slice(0, -4)
    const compPath = fullPath('comp/' + name) + '.vue'
    const distPath = fullPath('dist/' + name)
    const id = getRandomId()

    const { script, template, styles } = parseComponent(fs.readFileSync(compPath).toString())
    const { render, staticRenderFns } = compileToFunctions(template.content)

    fs.writeFileSync(distPath + '.js', script ? script.content : `
      module.exports = { props: ['node'] }
    `)

    fs.writeFileSync(distPath + '.vue.js', `
      const data = require('./${name}');
      (data.mixins || (data.mixins = [])).push({ mounted() { this.$el.setAttribute('id-${id}', '') } });
      module.exports = { ...data, render: ${render}, staticRenderFns: [${staticRenderFns.join(',')}] };
    `)

    css += styles.map(style => {
      return sass.renderSync({
        data: style.scoped ? `[id-${id}].${name}{${style.content}}` : style.content,
        outputStyle: 'compressed',
      }).css
    }).join('')
  })

fs.writeFileSync(fullPath('html/app.dist.css'), css)

const compiler = webpack({
  target: 'web',
  entry: path.resolve(__dirname, '../html/app.js'),
  output: {
    path: path.resolve(__dirname, '../html'),
    filename: 'app.dist.js'
  },
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
})
