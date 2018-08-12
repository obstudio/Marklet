import { Lexer, LexerOptions } from './Lexer'

function escape(html) {
  return html
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

export class DocLexer extends Lexer {
  constructor(options: LexerOptions = {}) {
    super({
      main: [
        {
          type: 'blockquote',
          regex: />([\w-]*) +/,
          push: 'text',
          token: (cap, content) => ({ style: cap[1], content })
        },
        {
          type: 'separator',
          regex: / *([-=])(\1|\.\1| \1)\2+ */,
          flags: 'e',
          token: (cap) => ({
            thick: cap[1] === '=',
            style: cap[2].length === 1 ? 'normal'
                 : cap[2][0] === ' ' ? 'dashed' : 'dotted'
          })
        },
        {
          type: 'paragraph',
          regex: /(?=.)/,
          push: 'text',
        },
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
          token: (cap) => `<del>${cap.next}</del>`
        },
        {
          // bold
          regex: /\*\*(?=\S)([\s\S]*?\S)\*\*(?!\*)/,
          token: (cap) => `<strong>${cap.next}</strong>`
        }
      ]
    }, {
      getters: {
        next(capture) {
          const result = this.parse(capture.reverse().find(item => !!item) || '')
          return result.map(token => token.text || token).join('')
        }
      },
      macros: {
        rgb: /#[0-9a-fA-F]{3}|#[0-9a-fA-F]{6}/
      },
      ...options,
    })
  }
}
