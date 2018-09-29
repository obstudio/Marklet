import { LexerConfig, TokenLike } from '@marklet/core'
import { InlineLexer } from '@marklet/inline'
import { Lexer } from '@marklet/lexer'

function escape(html: string): string {
  return html
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function collect(content: TokenLike[]) {
  return content
}

interface MarkletLexerConfig extends LexerConfig {
  /** enable header to align at center */
  header_align?: boolean
  /** allow section syntax */
  allow_section?: boolean
  /** default language in code block */
  default_language?: string
}

class MarkletInlineLexer extends InlineLexer {
  constructor(config: MarkletLexerConfig = {}) {
    super([
      {
        regex: /(?=\n[ \t]*(\n|$))/,
        pop: true
      },
      {
        type: 'escape',
        regex: /\\([\s\S])/,
        token: (cap) => cap[1]
      },
      {
        type: 'newline',
        regex: /\n/,
        token: '<br/>'
      },
      {
        type: 'code',
        regex: /(`+)\s*([\s\S]*?[^`]?)\s*\1(?!`)/,
        token: (cap) => `<code>${escape(cap[2])}</code>`
      },
      {
        type: 'strikeout',
        regex: /-(?=\S)([\s\S]*?\S)-(?!-)/,
        token: (cap) => `<del>${cap.inner}</del>`
      },
      {
        type: 'underline',
        regex: /_(?=\S)([\s\S]*?\S)_(?!_)/,
        token: (cap) => `<span style="text-decoration: underline">${cap.inner}</span>`
      },
      {
        type: 'bold',
        regex: /\*\*(?=\S)([\s\S]*?\S)\*\*(?!\*)/,
        token: (cap) => `<strong>${cap.inner}</strong>`
      },
      {
        type: 'italic',
        regex: /\*(?=\S)([\s\S]*?\S)\*(?!\*)/,
        token: (cap) => `<em>${cap.inner}</em>`
      },
      {
        type: 'comment',
        regex: /\(\((?=\S)([\s\S]*?\S)\)\)(?!\))/,
        token: (cap) => `<span class="comment">${cap.inner}</span>`
      },
      {
        type: 'package',
        regex: /{{(?=\S)([\s\S]*?\S)}}(?!})/,
        token: (cap) => `<code class="package">${cap.inner}</code>`
      },
      {
        type: 'link',
        regex: /\[(?:([^\]|]+)\|)?([^\]]+)\]/,
        token(cap) {
          let text, match
          if (cap[1]) {
            text = cap[1]
          } else if (match = cap[2].match(/^\$\w+(#\w+)$/)) {
            text = match[1]
            // } else if (this.resolve(cap[2]) in this.options.dictionary) { // FIXME: function not added yet
            //   text = this.options.dictionary[this.resolve(cap[2])]
          } else if (cap[2].includes('#') || cap[2].includes('/')) {
            text = cap[2].match(/[#/]([^#/]+)$/)[1]
          } else {
            text = cap[2]
          }
          return cap[2][0] === '!' ?
            `<img src="${cap[2].slice(1)}" alt="${text}" title="${text}">` : // TODO: special treatment like <a> necessary?
            `<a href="#" data-raw-url="${cap[2]}" onclick="event.preventDefault()"'>${text}</a>`
        }
      }
    ], config)
  }
}

class MarkletLexer extends Lexer {
  constructor(config: MarkletLexerConfig = {}) {
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

export interface ParseOptions {
  input: string
  config?: MarkletLexerConfig
}

export function parse(options: ParseOptions): TokenLike[] {
  let source
  if (options.input) {
    source = options.input
  } else {
    throw new Error("'input' option is required.")
  }
  return new MarkletLexer(options.config).parse(source)
}

export {
  MarkletLexer as Lexer,
  MarkletInlineLexer as InlineLexer,
  MarkletLexerConfig as LexerConfig,
}
