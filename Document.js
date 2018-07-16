const Lexer = require('./Lexer')

class DocLexer extends Lexer {
  constructor(options = {}) {
    super(DocLexer.Rules, {}, options)
  }
}

DocLexer.Rules = {
  main: [
    {
      type: 'blockquote',
      regex: '> +',
      push: 'paragraph'
    }
  ],
  paragraph: [
    {
      regex: /\n/,
      pop: true
    },
    {
      regex: /\d+/,
      token(capture) {
        return capture[0]
      }
    }
  ]
}

module.exports = DocLexer