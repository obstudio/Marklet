const equal = require('fast-deep-equal')
const detok = require('@marklet/detok')
const Marklet = require('markletjs')

module.exports = (result) => {
  const content = result.content
  const parseResult = Marklet.parse({ input: detok(result.content) })
  result = equal(parseResult, content)
  if (!result) {
    console.log(content)
    console.log(parseResult)
  }
  return result
}
