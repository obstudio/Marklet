import { DocumentLexer, TokenLike, LexerToken } from '@marklet/core'
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
          regex: /(\^{1,4}) +([^\n]+?)( +\^)?/,
          eol: true,
          push: 'main',
          prefix_regex(cap) {
            const level = cap[1].length
            return `(?=[#^]{1,${level}} +[^\\n])`
          },
          token(cap, content) {
            const text = this.inline(cap[2])
            const initial = !cap[3] === (this.config.section_default === 'open') ? 'open' : 'closed'
            return { level: cap[1].length, text, initial, content }
          }
        },
        {
          type: 'quote',
          regex: />([\w-]*) +/,
          prefix_regex: /\n[ \t]*\n/,
          push: 'main',
          token: (cap, content) => ({
            style: cap[1],
            content,
          })
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
          token: (cap, _, { default_language }) => ({
            lang: cap[2] || default_language,
            text: cap[3] || '',
          })
        },
        {
          type: 'usages',
          regex: /(?= *\? +\S)/,
          strict: true,
          push: {
            type: 'usage',
            regex: / *\? +([^\n]+?)/,
            prefix_regex: /(?= *\? )/,
            eol: true,
            push: 'text',
            token(cap, [detail]) {
              return {
                text: this.inline(cap[1]),
                detail,
              }
            }
          },
        },
        {
          type: 'list',
          regex: / *(?={{bull}} +[^\n]+)/,
          strict: true,
          push: {
            type: 'list-item',
            regex: /( *)({{bull}}) +(?=[^\n]+)/,
            prefix_regex: /\n? *(?={{bull}} +[^\n]+)/,
            push: 'text',
            token: (cap, [text]) => ({
              text,
              ordered: cap[2].length > 1,
              indent: cap[1].length,
            })
          },
          token: (_, cont) => collect(cont)
        },
        {
          type: 'inlinelist',
          regex: /(?=\+)/,
          push: [
            {
              type: 'inlinelist-item',
              regex: /\+/,
              prefix_regex: /\+?$|\+\n(?=\+)|\+?(?=\n)|(?=\+)/,
              push: 'text',
              token: (_, [text]) => text
            },
            {
              regex: /\n|$/,
              pop: true
            }
          ],
        },
        {
          type: 'table',
          test: 'marklet_table',
          regex: /{{sign}}({{tab}}{{sign}})*{{eol}}/,
          strict: true,
          push: {
            type: 'table-row',
            regex: /(?=\S)/,
            strict: true,
            push: {
              type: 'table-cell',
              regex: /({{cell}})({{eol}}|{{tab}})/,
              pop: (cap) => cap[2].includes('\n'),
              token([_, text]) {
                return this.inline(text)
              }
            },
          },
          token([header], content) {
            const columns = header.match(/[*=<>]+/g).map((col) => ({
              bold: col.includes('*'),
              align: col.includes('<') ? 'left'
                : col.includes('=') ? 'center'
                : col.includes('>') ? 'right' : 'center'
            }))
            content = content.map((row: LexerToken) => row.content.slice(0, columns.length))
            return { content, columns }
          }
        },
        {
          type: 'paragraph',
          regex: /(?=\S)/,
          push: 'text',
          token: (_, [text]) => ({ text })
        }
      ],
    }, {
      macros: {
        bull: /-|\d+\./,
        sign: /[*=<>]+/,
        tab: /\t+| {4,}/,
        eol: /[ \t]*(?:\n|$)/,
        cell: /\S(?: {0,3}\S)*/,
      },
      config: {
        header_align: true,
        allow_section: true,
        marklet_table: true,
        section_default: 'open',
        default_language: '',
        ...config,
      }
    })
  }
}
