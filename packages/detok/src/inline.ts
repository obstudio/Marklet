import cheerio from 'cheerio'

type InlineDetokenizer = (el: CheerioElement) => string

export function iterate(el: CheerioElement) {
  let result = ''
  for (const child of el.children) {
    if (child.type === 'text') {
      result += child.nodeValue
    } else if (child.type === 'tag') {
      result += detokenizers[child.tagName](child)
    }
  }
  return result
}

function makeWrap(leftWrap: string, rightWrap: string = leftWrap): InlineDetokenizer {
  return (el: CheerioElement) => leftWrap + iterate(el) + rightWrap
}

const detokenizers: Record<string, InlineDetokenizer> = {
  em: makeWrap('*'),
  strong: makeWrap('**'),
  del: makeWrap('-'),
  br: () => '\n',
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
}

export default function detokenize(token: string) {
  let result = ''
  cheerio.load(token)('body').each((_, el) => result += iterate(el))
  return result
}
