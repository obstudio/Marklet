import { TokenLike, LexerToken } from '@marklet/core'
import { ListItem } from '@marklet/parser'
import inline from './inline'

type DocumentDetokenizer = (tok: LexerToken) => string

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
      + (token.initial ? ' ^' : ''),
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
  list: (token: LexerToken) => 
    token.children.map(detokenize).join(''),
  listItem: (token: ListItem) =>
    ' '.repeat(token.indent)
      + token.order ? token.order + '. ' : '- '
      + '\n'
      + (token.children || []).map(detokenize).join(''),
  inlinelist: (token: LexerToken) => 
    '+ '
      + token.content.map((item: string) => inline(item)).join(' + '),
  table: (token: LexerToken) => 
    '',
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
