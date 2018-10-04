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
          prefix_regex: /\n[ \t]*\n/,
          push: 'main',
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
              prefix_regex: /(?= *\? )/,
              eol: true,
              push: 'text',
              token(cap, [inner]) {
                return {
                  text: this.inline(cap[1]),
                  detail: inner,
                }
              }
            },
          ],
        },
        {
          type: 'list',
          regex: / *(?={{bullet}} +[^\n]+)/,
          strict: true,
          push: [
            {
              type: 'item',
              regex: /( *)({{bullet}}) +(?=[^\n]+)/,
              prefix_regex: /\n? *(?={{bullet}} +[^\n]+)/,
              push: 'text',
              token(cap, [inner]) {
                return {
                  text: inner,
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
              prefix_regex: /\+?$|\+\n(?=\+)|\+?(?=\n)|(?=\+)/,
              push: 'text',
              token(_, [inner]) {
                return inner
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
          token: (_, [inner]) => ({ text: inner })
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
