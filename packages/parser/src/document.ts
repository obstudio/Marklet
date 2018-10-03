import { DocumentLexer, TokenLike } from '@marklet/core'
import { LexerConfig } from './index'
import MarkletInlineLexer from './inline'

function collect(content: TokenLike[]) {
  return content
}

export default class MarkletDocumentLexer extends DocumentLexer {
  constructor(config: LexerConfig = {}) {
    super({
      text: new MarkletInlineLexer(config),
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
            if (this.config.header_align && cap[3]) {
              text = this.inline(cap[2])
              center = true
            } else {
              text = this.inline(cap[2] + (cap[3] || ''))
              center = false
            }
            return { level: cap[1].length, text, center }
          }
        },
        {
          type: 'section',
          test: 'allow_section',
          regex: /(\^{1,4}) +([^\n]+?)/,
          eol: true,
          push: 'main',
          token(cap) {
            return {
              level: cap[1].length,
              text: this.inline(cap[2]),
            }
          }
        },
        {
          type: 'quote',
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
              lang: cap[2] || this.config.default_language,
              text: cap[3] || '',
            }
          }
        },
        {
          type: 'usages',
          regex: /(?= *\? +\S)/,
          strict: true,
          push: [
            {
              type: 'usage',
              regex: / *\? +([^\n]+?)/,
              eol: true,
              push: [
                {
                  regex: /(?= *\? )/,
                  pop: true
                },
                {
                  include: 'text'
                }
              ],
              token(cap, cont) {
                return {
                  text: this.inline(cap[1]),
                  content: cont,
                }
              }
            }
          ]
        },
        {
          type: 'list',
          regex: / *(?={{bullet}} +[^\n]+)/,
          strict: true,
          push: [
            {
              type: 'item',
              regex: /( *)({{bullet}}) +(?=[^\n]+)/,
              push: [{
                regex: /\n? *(?={{bullet}} +[^\n]+)/,
                pop: true
              }, {
                include: 'text'
              }],
              token(cap, cont) {
                return {
                  text: cont.join(''),
                  ordered: cap[2].length > 1,
                  indent: cap[1].length,
                }
              }
            }
          ],
          token: (_, cont) => collect(cont)
        },
        {
          type: 'inlinelist',
          regex: /(?=\+)/,
          push: [
            {
              type: 'item',
              regex: /\+/,
              push: [
                {
                  regex: /\+?$|\+\n(?=\+)|\+?(?=\n)|(?=\+)/,
                  pop: true
                },
                {
                  include: 'text'
                }
              ],
              token(_, cont) {
                return cont.join('')
              }
            },
            {
              regex: /\n|$/,
              pop: true
            }
          ],
          token: (_, cont) => ({ content: cont })
        },
        {
          type: 'table',
          regex: /$^/, // FIXME: placeholder for syntax discussion
          push: [],
          token: (_, cont) => ({ content: cont })
        },
        {
          type: 'paragraph',
          push: 'text',
          token: (_, cont) => ({ text: cont.join('') })
        }
      ],
      block: [
        {
          regex: /\n[ \t]*\n/,
          pop: true
        },
        {
          include: 'main'
        }
      ],
    }, {
      macros: {
        bullet: /-|\d+\./,
      },
      config: {
        header_align: true,
        allow_section: true,
        default_language: '',
        ...config,
      }
    })
  }
}
