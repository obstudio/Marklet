const { parse, Lexer } = require('@marklet/parser')
const renderer = require('@marklet/renderer')

const lexer = new Lexer()
const config = lexer.config

function render(element, source) {
  renderer.embed(element, lexer.parse(source))
}

module.exports = {
  parse,
  Lexer,
  config,
  render,
}
