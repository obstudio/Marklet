const Ajv = require('ajv')

const validator = new Ajv()

const validate = validator.compile(require('./schema.json'))

module.exports = (res) => {
  return validate(res)
}