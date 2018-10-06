const { parse, DocumentLexer } = require('@marklet/parser')
const renderer = require('@marklet/renderer')

const lexer = new DocumentLexer()
const config = lexer.config

function render(element, source) {
  renderer.embed(element, lexer.parse(source))
}

module.exports = {
  Lexer: DocumentLexer,
  parse,
  config,
  render,
}
