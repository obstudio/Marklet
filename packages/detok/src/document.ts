import { TokenLike, LexerToken } from '@marklet/core'
import { ListItem } from '@marklet/parser'
import inline from './inline'

type DocumentDetokenizer = (tok: LexerToken) => string

const alignMap = {
  left: '<',
  center: '=',
  right: '>'
}
let listLevel = 0

function toCamel(string: string) {
  return string.replace(/-[a-z]/g, match => match.slice(1).toUpperCase())
}

const detokenizers: Record<string, DocumentDetokenizer> = {
  heading: (token: LexerToken) =>
    '#'.repeat(token.level)
    + ' '
    + inline(token.text)
    + (token.center ? ' #' : ''),
  section: (token: LexerToken) =>
    '^'.repeat(token.level)
    + ' '
    + inline(token.text)
    + (token.initial === 'closed' ? ' ^' : '') // FIXME: currently not taking `section_default` into consideration
    + '\n'
    + detokenize(token.content),
  quote: (token: LexerToken) =>
    '>'
    + token.style
    + ' '
    + detokenize(token.content),
  separator(token: LexerToken) {
    const sep = token.thick ? '=' : '-'
    switch (token.style) {
      case 'normal': return sep.repeat(3)
      case 'dashed': return sep + (' ' + sep).repeat(2)
      case 'dotted': return sep + ('.' + sep).repeat(2)
    }
  },
  codeblock: (token: LexerToken) =>
    '```'
    + token.lang
    + '\n'
    + token.text
    + '\n```',
  usage: (token: LexerToken) =>
    '? '
    + inline(token.text)
    + '\n'
    + detokenize(token.content),
  usages: (token: LexerToken) =>
    detokenize(token.content),
  list: (token: LexerToken) => token.children.map(detokenize).join(''),
  listItem: (token: ListItem) => {
    let result = ' '.repeat(listLevel * 2) + (token.order ? token.order + '. ' : '- ') + detokenize(token.text)
    ++listLevel
    result += (token.children || []).map(detokenize).join('')
    --listLevel
    return result
  },
  inlinelist: (token: LexerToken) =>
    '+ '
    + token.content.map((item: string) => inline(item)).join(' + '),
  table: (token: LexerToken) =>
    token.columns.map((col: any) => (col.bold ? '*' : '') + alignMap[<keyof typeof alignMap>col.align]).join('\t')
    + '\n'
    + token.content.map((row) => (<string[]>row).map(detokenize).join('\t')).join('\n'),
  paragraph: (token: LexerToken) =>
    detokenize(token.text),
}

export default function detokenize(input: TokenLike[] | TokenLike): string {
  if (Array.isArray(input)) {
    return input.map(item => detokenize(item)).join('\n\n')
  } else {
    return typeof input === 'string'
      ? inline(input)
      : detokenizers[toCamel(input.type)](input)
  }
}
