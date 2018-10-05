const cheerio = require('cheerio')
const yaml = require('js-yaml')
const path = require('path')
const Ajv = require('ajv')
const fs = require('fs')

const validator = new Ajv({})

const textTags = ['br', 'code', 'em', 'strong', 'del', 'span', 'a']
validator.addFormat('text', (str) =>
  cheerio.load(str)('body *').toArray().every((element) =>
    element.type === 'text' || element.type === 'tag' && textTags.includes(element.tagName)))

const schema = yaml.safeLoad(fs.readFileSync(path.resolve(__dirname, 'schema.yaml')))
const validate = validator.compile(schema)

module.exports = (res) => {
  return validate(res)
}