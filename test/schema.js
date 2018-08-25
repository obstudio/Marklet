const Ajv = require('ajv')

const validator = new Ajv({
})

validator.addFormat('text', () => true)

const validate = validator.compile(require('./schema.json'))

module.exports = (res) => {
  return validate(res)
}