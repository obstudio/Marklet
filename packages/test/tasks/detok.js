const { DocumentLexer } = require('@marklet/parser')
const equal = require('fast-deep-equal')
const detok = require('@marklet/detok')
const util = require('util')

const lexer = new DocumentLexer()

const inspectOptions = {
  showHidden: false,
  depth: null,
  colors: true,
  breakLength: 50,
}

module.exports = {
  title: 'Detokenize',
  test(result) {
    const content = result.content
    const parseResult = lexer.parse(detok(result.content))
    result = !equal(parseResult, content)
    if (result) {
      console.log(util.inspect(content, inspectOptions))
      console.log(util.inspect(parseResult, inspectOptions))
      return true
    }
  }
}
