import cheerio from 'cheerio'
import { TokenLike, LexerToken } from '../../core'
type InlineTokenTypes = 'br' | 'code' | 'span' | 'em' | 'strong' | 'del'
type BlockTokenTypes = 'text' | 'heading' | 'section' | 'quote' | 'separator' | 'codeblock' | 'usage' | 'usages' | 'list' | 'inlinelist' | 'table' | 'paragraph'

function iterate(el: CheerioElement) {
  let result = ''
  for (const child of el.children) {
    if (child.type === 'text') {
      result += child.nodeValue
    } else if (child.type === 'tag') {
      result += textDetokenizers[<InlineTokenTypes>child.tagName](child)
    }
  }
  return result
}

function makeSimpleWrap(leftWrap: string, rightWrap = leftWrap) {
  return (el: CheerioElement) => leftWrap + iterate(el) + rightWrap
}


export const textDetokenizers: Record<InlineTokenTypes, (el: CheerioElement) => string> = {
  br() {
    return '\n'
  },
  code(el) {
    const code = el.firstChild.nodeValue
    if (el.attribs.class === 'package') {
      return '{{' + code + '}}'
    }
    const backticks = code.match(/`+/g)
    const wrap = '`'.repeat(backticks === null ? 1 : Math.max(...backticks.map(b => b.length)) + 1)
    return wrap + code + wrap
  },
  span(el) {
    const content = iterate(el)
    return el.attribs.class === 'comment' ? '((' + content + '))' : '_' + content + '_'
  },

  em: makeSimpleWrap('*'),
  strong: makeSimpleWrap('**'),
  del: makeSimpleWrap('-')
}

export const detokenizers: Record<BlockTokenTypes, (tok: TokenLike) => string> = {
  text(token: string) {
    const $ = cheerio.load(token)
    const root = $('body')
    let result = ''
    root.each((_, el) => result += iterate(el))

    return result
  },
  heading(token: LexerToken) {
    const prefix = '#'.repeat(token.level)
    return prefix + ' ' + detokenize(token.text)
      + (token.center ? ' ' + prefix : '')
  },
  section(token: LexerToken) {
    return '^'.repeat(token.level) + ' ' + detokenize(token.text)
  },
  quote(token: LexerToken) {
    return '>' + token.style + ' ' + detokenize(token.content)
  },
  separator(token: LexerToken) {
    const sep = token.thick ? '=' : '-'
    switch (token.style) {
    case 'normal':
      return sep.repeat(3)
    case 'dashed':
      return sep + (' ' + sep).repeat(2)
    case 'dotted':
      return sep + ('.' + sep).repeat(2)
    }
  },
  codeblock(token: LexerToken) {
    return '```' + token.lang + '\n' + token.text + '\n```'
  },
  usage(token: LexerToken) {
    return '? ' + detokenize(token.text) + '\n' + detokenize(token.content)
  },
  usages(token: LexerToken) {
    return detokenize(token.content)
  },
  list(token: LexerToken) {
    let result = ''
    let count = 0
    for (const item of token.content) {
      const bullet = (<LexerToken>item).ordered ? ++count : '-'
      result += ' '.repeat(token.indent) + bullet + ' ' + detokenize((<LexerToken>item).content)
    }
    return result
  },
  inlinelist(token: LexerToken) {
    return '+' + token.content.join('+') + '+'
  },
  table(/* token */) {
    // TODO: add detok when lexer implement this
    return ''
  },
  paragraph(token: LexerToken) {
    return detokenize(token.text)
  }
}

export function detokenize(input: TokenLike[] | TokenLike) {
  if (Array.isArray(input)) {
    let result = ''
    for (const token of input) {
      result += typeof token === 'string' ? detokenizers.text(token) : detokenizers[<BlockTokenTypes>token.type](token) + '\n\n'
    }
    return result
  } else {
    return typeof input === 'string' ? detokenizers.text(input) : detokenizers[<BlockTokenTypes>input.type](input)
  }
}
