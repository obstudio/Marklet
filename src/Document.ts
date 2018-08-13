import { Lexer, LexerOptions } from './Lexer'

function escape(html) {
  return html
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

interface DocLexerOptions extends LexerOptions {
  /** enable header to align at center */
  header_align?: boolean
  /** allow section syntax */
  allow_sections?: boolean
  /** default language in code block */
  default_language?: string
}

export class DocLexer extends Lexer {
  constructor(options: DocLexerOptions = {}) {
    super({
      main: [
        {
          type: 'newline',
          regex: /\n+/,
          token: null
        },
        {
          type: 'heading',
          regex: /(#{1,4}) +([^\n]+?)( +#)?/,
          eol: true,
          token(cap) {
            let text, center
            if (this.options.header_align && cap[3]) {
              text = this._parse(cap[2], 'text').result.join('')
              center = true
            } else {
              text = this._parse(cap[2] + (cap[3] || ''), 'text').result.join('')
              center = false
            }
            return { level: cap[1].length, text, center }
          }
        },
        {
          type: 'section',
          regex: /(\^{1,4}) +([^\n]+?)/,
          eol: true,
          push(cap) {
            this.options._section_level = cap[1].length
            return 'main'
          },
          token(cap) {
            const text = this._parse(cap[2], 'text').result.join('')
            return { level: cap[1].length, text }
          }
        },
        {
          type: 'blockquote',
          regex: />([\w-]*) +/,
          push: 'block',
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
          token(cap) {
            return {
              lang: cap[2] || this.options.default_language,
              text: cap[3] || '',
            }
          }
        },
        {
          type: 'paragraph',
          regex: /(?=.)/,
          push: 'text',
          token: (_, cont) => ({ text: cont.join('') })
        },
      ],
      block: [
        {
          regex: /\n[ \t]*\n/,
          pop: true
        },
        {
          include: 'main'
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
      header_align: true,
      allow_sections: true,
      default_language: '',
      _section_level: 0,
      ...options,
    })
  }
}
