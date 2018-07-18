const Lexer = require('./Lexer')

function escape(html) {
  return html
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

class DocLexer extends Lexer {
  constructor(options = {}) {
    super(DocLexer.Rules, DocLexer.Macros, DocLexer.Options)
  }
}

DocLexer.Rules = {
  main: [
    {
      // blockquote
      regex: /> +/,
      push: 'text',
      token: (_, cont) => `<blockquote>${cont.map(tok => tok.text).join('')}</blockquote>`
    },
    {
      // paragraph
      regex: /(?=.)/,
      push: 'text',
      token: (_, cont) => `<p>${cont.map(tok => tok.text).join('')}</p>`
    }
  ],
  text: [
    {
      // escape
      regex: /\\([\s\S])/,
      token: (cap) => cap[1]
    },
    {
      // new paragraph
      regex: /\n[ \t]*\n/,
      pop: true
    },
    {
      // new line
      regex: /\n/,
      token: '<br/>'
    },
    {
      // code
      regex: /(`+)\s*([\s\S]*?[^`]?)\s*\1(?!`)/,
      token: (cap) => `<code>${escape(cap[2])}</code>`
    },
    {
      // strikeout
      regex: /-(?=\S)([\s\S]*?\S)-/,
      token: (cap, cont) => `<del>${cap.next}</del>`
    },
    {
      // bold
      regex: /\*\*(?=\S)([\s\S]*?\S)\*\*(?!\*)/,
      token: (cap) => `<strong>${cap.next}</strong>`
    },
  ]
}

DocLexer.Macros = {}

DocLexer.Options = {
  getters: {
    next(capture) {
      const result = this.parse(capture.reverse().find(item => item))
      return result.content.map(token => token.text).join('')
    }
  }
}

module.exports = DocLexer