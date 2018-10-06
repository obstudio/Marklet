import { TokenLike, LexerToken } from '@marklet/core'
import inlineDetokenize from './inline'

type DocumentDetokenizer = (tok: LexerToken) => string

const detokenizers: Record<string, DocumentDetokenizer> = {
  heading: (token: LexerToken) => 
    '#'.repeat(token.level)
      + ' '
      + detokenize(token.text)
      + (token.center ? ' #' : ''),
  section: (token: LexerToken) => 
    '^'.repeat(token.level)
      + ' '
      + detokenize(token.text)
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
      + detokenize(token.text)
      + '\n'
      + detokenize(token.content),
  usages: (token: LexerToken) => 
    detokenize(token.content),
  list(token: LexerToken) {
    let result = ''
    let count = 0
    for (const item of token.content) {
      const bullet = (<LexerToken>item).ordered ? ++count : '-'
      result += ' '.repeat(token.indent) + bullet + ' ' + detokenize((<LexerToken>item).content)
    }
    return result
  },
  inlinelist: (token: LexerToken) => 
    '+ ' + token.content.join(' + '),
  table: (token: LexerToken) => 
    // TODO: add detok when lexer implement this
    '',
  paragraph: (token: LexerToken) => 
    detokenize(token.text),
}

export default function detokenize(input: TokenLike[] | TokenLike) {
  if (Array.isArray(input)) {
    let result = ''
    for (const token of input) {
      result += typeof token === 'string' ? inlineDetokenize(token) : detokenizers[token.type](token) + '\n\n'
    }
    return result
  } else {
    return typeof input === 'string' ? inlineDetokenize(input) : detokenizers[input.type](input)
  }
}
