const cheerio = require('cheerio')
const yaml = require('js-yaml')
const path = require('path')
const Ajv = require('ajv')
const fs = require('fs')

const textTags = ['br', 'code', 'em', 'strong', 'del', 'span', 'a']

const validator = new Ajv()
  .addFormat('text', (source) => {
    return cheerio.load(source)('body *').toArray().every((element) => {
      return element.type === 'text' || element.type === 'tag' && textTags.includes(element.tagName)
    })
  })

const schema = yaml.safeLoad(fs.readFileSync(path.resolve(__dirname, 'schema.yaml')))
const validate = validator.compile(schema)

module.exports = {
  title: 'Shape Correctness',
  test(data) {
    const result = !validate(data.content)
    if (result) {
      console.log(JSON.stringify(data, null, 2))
      return true
    }
  }
}
