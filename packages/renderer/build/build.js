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
  return '0'.repeat(6 - id.length) + id
}

let css = ''

const dist = fullPath('dist')
if (!fs.existsSync(dist)) {
  fs.mkdirSync(dist)
}

fs.readdirSync(fullPath('comp'))
  .filter(name => name.endsWith('.vue'))
  .forEach(name => {
    name = name.slice(0, -4)
    const compPath = fullPath('comp/' + name) + '.vue'
    const distPath = fullPath('dist/' + name)
    const id = getRandomId()
    let scoped = false

    const { script, template, styles } = parseComponent(fs.readFileSync(compPath).toString())
    const { render, staticRenderFns: fns } = compileToFunctions(template.content)

    css += styles.map(style => {
      scoped |= style.scoped
      return sass.renderSync({
        data: style.scoped ? `[id-${id}].${name}{${style.content}}` : style.content,
        outputStyle: 'compressed',
      }).css
    }).join('')

    fs.writeFileSync(distPath + '.js', script ? script.content : `
      module.exports = { props: ['node'] }
    `)

    fs.writeFileSync(distPath + '.vue.js', scoped ? `
      const data = require('./${name}');
      (data.mixins || (data.mixins = [])).push({ mounted() { this.$el.setAttribute('id-${id}', '') } });
      module.exports = { ...data, render: ${render}, staticRenderFns: [${fns.join(',')}] };
    ` : `
      module.exports = { ...require('./${name}'), render: ${render}, staticRenderFns: [${fns.join(',')}] };
    `)
  })

fs.writeFileSync(fullPath('html/marklet.min.css'), css)
fs.copyFileSync(fullPath('html/marklet.min.css'), fullPath('docs/marklet.min.css'))

const compiler = webpack({
  target: 'web',
  entry: path.resolve(__dirname, '../html/marklet.js'),
  output: {
    path: path.resolve(__dirname, '../html'),
    filename: 'marklet.min.js'
  },
  plugins: [
    new webpack.IgnorePlugin(/fs/)
  ]
})

new webpack.ProgressPlugin().apply(compiler)

compiler.run((error, stat) => {
  if (error) {
    console.log(error)
  } else if (stat.compilation.errors.length) {
    console.log(stat.compilation.errors.join('\n'))
  } else {
    console.log('Succeed.')
    fs.copyFileSync(fullPath('html/marklet.min.js'), fullPath('docs/marklet.min.js'))
  }
})
