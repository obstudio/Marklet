const cheerio = require('cheerio')

function iterate(el) {
  let result = ''
  for (const child of el.children) {
    if (child.type === 'text') {
      result += child.nodeValue
    } else if (child.type === 'tag') {
      result += textDetokenizers[child.tagName](child)
    }
  }
  return result
}

function makeSimpleWrap(leftWrap, rightWrap = leftWrap) {
  return (el) => leftWrap + iterate(el) + rightWrap
}

const textDetokenizers = {
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

const detokenizers = {
  text(token) {
    const $ = cheerio.load(token)
    const root = $('body')
    let result = ''
    root.each((_, el) => result += iterate(el))

    return result
  },
  heading(token) {
    const prefix = '#'.repeat(token.level)
    return prefix + ' ' + detokenize(token.text)
      + (token.center ? ' ' + prefix : '')
  },
  section(token) {
    return '^'.repeat(token.level) + ' ' + detokenize(token.text)
  },
  quote(token) {
    return '>' + token.style + ' ' + detokenize(token.content)
  },
  separator(token) {
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
  codeblock(token) {
    return '```' + token.lang + '\n' + token.text + '\n```'
  },
  usage(token) {
    return '? ' + detokenize(token.text) + '\n' + detokenize(token.content)
  },
  usages(token) {
    return detokenize(token.content)
  },
  list(token) {
    let result = ''
    let count = 0
    for (const item of token.content) {
      const bullet = item.ordered ? ++count : '-'
      result += ' '.repeat(token.indent) + bullet + ' ' + detokenize(item.content)
    }
    return result
  },
  inlinelist(/* token */) {
    // TODO: add detok when lexer implement this
    return ''
  },
  table(/* token */) {
    // TODO: add detok when lexer implement this
    return ''
  },
  paragraph(token) {
    return detokenize(token.text)
  }
}

function detokenize(input) {
  if (Array.isArray(input)) {
    let result = ''
    for (const token of input) {
      result += typeof token === 'string' ? detokenizers.text(token) : detokenizers[token.type](token) + '\n\n'
    }
    return result
  } else {
    return typeof input === 'string' ? detokenizers.text(input) : detokenizers[input.type](input)
  }
}

module.exports = {
  detokenize,
  detokenizers
}
