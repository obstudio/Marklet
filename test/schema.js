const cheerio = require('cheerio')
const Ajv = require('ajv')

const validator = new Ajv({
})

const textTags = ['br', 'code', 'em', 'strong', 'del', 'span', 'a']
validator.addFormat('text', (str) =>
  cheerio.load(str)('body *').toArray().every((element) =>
    element.type === 'text' || element.type === 'tag' && textTags.includes(element.tagName)))

const validate = validator.compile(require('./schema.json'))

module.exports = (res) => {
  return validate(res)
}