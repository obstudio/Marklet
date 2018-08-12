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
          type: 'newline',
          regex: /\n+/,
          token: null
        },
        {
          type: 'heading',
          regex: /(#{1,4}) +([^\n]+?) *(#*)/,
          eol: true,
          token(cap) {
            const text = this._parse(cap[2], 'text').result.join('')
            return { level: cap[1].length, text }
          }
        },
        {
          type: 'blockquote',
          regex: />([\w-]*) +/,
          push: [
            {
              regex: /\n[ \t]*\n/,
              pop: true
            },
            {
              include: 'main'
            },
          ],
          token: (cap, content) => ({ style: cap[1], content })
        },
        {
          type: 'separator',
          regex: / *([-=])(\1|\.\1| \1)\2+/,
          eol: true,
          token: (cap) => ({
            thick: cap[1] === '=',
            style: cap[2].length === 1 ? 'normal'
                 : cap[2][0] === ' ' ? 'dashed' : 'dotted'
          })
        },
        {
          type: 'codeblock',
          regex: / *(`{3,}) *([\w-]+)? *\n([\s\S]*?)\n? *\1/,
          eol: true,
          token: (cap) => ({
            lang: cap[2],
            text: cap[3]
          })
        },
        {
          type: 'paragraph',
          regex: /(?=.)/,
          push: 'text',
          token: (_, cont) => ({ text: cont.join('') })
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
          regex: /(?=\n[ \t]*(\n|$))/,
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
          const result = this._parse(capture.reverse().find(item => !!item) || '')
          return result.result.map(token => token.text || token).join('')
        }
      },
      macros: {
        rgb: /#[0-9a-fA-F]{3}|#[0-9a-fA-F]{6}/
      },
      ...options,
    })
  }
}
