import { DocumentLexer, LexerToken } from '@marklet/core'
import { LexerConfig } from './index'
import MarkletInlineLexer from './inline'

export interface ListItem extends LexerToken {
  text: string
  order: string
  indent?: number
  children?: ListItem[]
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
          token([_, bullet, text, mark]) {
            let center
            if (this.config.header_align && mark) {
              text = this.inline(text)
              center = true
            } else {
              text = this.inline(text + (mark || ''))
              center = false
            }
            return { level: bullet.length, text, center }
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
          token(cap, content, { section_default }) {
            const text = this.inline(cap[2])
            const initial = !cap[3] === (section_default === 'open') ? 'open' : 'closed'
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
          regex: /(?=[ \t]*{{bull}}[ \t]+)/,
          strict: true,
          push: {
            type: 'list-item',
            regex: /([ \t]*)({{bull}})[ \t]+/,
            prefix_regex: /(?=[ \t]*{{bull}}[ \t]+)/,
            push: 'text',
            token([_, indent, bullet], [text], { tab_indent }) {
              return {
                text,
                order: bullet.slice(0, -1),
                indent: indent.replace(/\t/g, ' '.repeat(tab_indent)).length,
              }
            }
          },
          token(_, content: ListItem[]) {
            const indents: number[] = []
            const root: ListItem[] = []
            content.forEach((item) => {
              let id = indents.length - 1
              let currentList = root
              for (; id >= 0; id -= 1) {
                if (indents[id] < item.indent) break
              }
              indents.splice(id + 1, Infinity, item.indent)
              for (; id >= 0; id -= 1) {
                const lastItem = currentList[currentList.length - 1]
                currentList = lastItem.children = lastItem.children || []
              }
              delete item.indent
              currentList.push(item)
            })
            return { children: root }
          }
        },
        {
          type: 'inlinelist',
          regex: /(?=\+[ \t]+)/,
          prefix_regex: /\+[ \t]*\n(?!\+)/,
          push: {
            type: 'inlinelist-item',
            regex: /\+\s*/,
            prefix_regex: /\n|(?=\+)/,
            push: 'text',
            token: (_, [text]) => text.trim()
          },
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
        bull: /-|[a-zA-Zα-ωΑ-Ω\d]+\./,
        sign: /[*=<>]+/,
        tab: /\t+| {4,}/,
        eol: /[ \t]*(?:\n|$)/,
        cell: /\S(?: {0,3}\S)*/,
      },
      config: {
        tab_indent: 2,
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
