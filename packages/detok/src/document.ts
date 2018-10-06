import { TokenLike, LexerToken } from '@marklet/core'
import { Tokens } from '@marklet/parser'
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
  heading: (token: Tokens.Heading) =>
    '#'.repeat(token.level)
    + ' '
    + inline(token.text)
    + (token.center ? ' #' : ''),
  section: (token: Tokens.Section) =>
    '^'.repeat(token.level)
    + ' '
    + inline(token.text)
    + (token.initial === 'closed' ? ' ^' : '') // FIXME: currently not taking `section_default` into consideration
    + '\n'
    + detokenize(token.content),
  quote: (token: Tokens.Quote) =>
    '>'
    + token.style
    + ' '
    + detokenize(token.content),
  separator(token: Tokens.Separator) {
    const sep = token.thick ? '=' : '-'
    switch (token.style) {
      case 'normal': return sep.repeat(3)
      case 'dashed': return sep + (' ' + sep).repeat(2)
      case 'dotted': return sep + ('.' + sep).repeat(2)
    }
  },
  codeblock: (token: Tokens.CodeBlock) =>
    '```'
    + token.lang
    + '\n'
    + token.text
    + '\n```',
  usage: (token: Tokens.Usage) =>
    '? '
    + inline(token.text)
    + '\n'
    + detokenize(token.content),
  usages: (token: Tokens.Usages) => detokenize(token.content),
  list: (token: Tokens.List) => token.children.map(detokenize).join(''),
  listItem(token: Tokens.ListItem) {
    let result = ' '.repeat(listLevel * 2)
      + (token.order ? token.order + '. ' : '- ')
      + detokenize(token.text)
    listLevel += 1
    result += (token.children || []).map(detokenize).join('')
    listLevel -= 1
    return result
  },
  inlinelist: (token: Tokens.InlineList) =>
    '+ '
    + token.content.map(inline).join(' + '),
  table: (token: Tokens.Table) =>
    token.columns.map(col => (col.bold ? '*' : '') + alignMap[col.align]).join('\t')
    + '\n'
    + token.data.map(row => row.map(inline).join('\t')).join('\n'),
  paragraph: (token: Tokens.Paragraph) => inline(token.text),
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
