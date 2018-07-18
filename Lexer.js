class Lexer {
  constructor(rules, macros = {}, options = {}) {
    function resolve(rule) {
      if (rule.regex) {
        let src = rule.regex.source || rule.regex
        for (const key in macros) {
          src = src.replace(new RegExp(`{{${key}}}`, 'g'), `(?:${macros[key]})`)
        }
        rule.regex = new RegExp(`^` + src)
      }
      if (rule.push instanceof Array) rule.push.forEach(resolve)
      return rule
    }
    this.rules = {}
    for (const key in rules) {
      this.rules[key] = rules[key].map(resolve)
    }
    this.options = options
    this.context = 'main'
  }

  getContext(context) {
    const result = typeof context === 'string'
      ? this.rules[context]
      : context
    for (let i = result.length - 1; i >= 0; i -= 1) {
      if (result[i].include) {
        result.splice(i, 1, ...this.getContext(result[i].include))
      }
    }
    return result
  }

  getToken(rule, capture, content) {
    let result
    if (typeof rule.token === 'string') {
      result = rule.token
    } else if (rule.token instanceof Function) {
      const getters = this.options.getters || {}
      for (const key in getters) {
        Object.defineProperty(capture, key, {
          get: () => getters[key].call(this, capture)
        })
      }
      result = rule.token.call(this, capture, content)
    }
    if (result instanceof Array) {
      result = { content: result }
    } else if (typeof result === 'string') {
      result = { text: result }
    }
    return result
  }

  parse(source, context = this.context) {
    let index = 0, unmatch = ''
    const result = []
    const rules = this.getContext(context)
    const _context = this.context
    this.context = context
    
    source = source.replace(/\r\n/g, '\n')
    while (source) {
      /**
       * Matching status:
       * 0. No match was found
       * 1. Found match and continue
       * 2. Found match and pop
       */
      let status = 0
      for (const rule of rules) {
        const capture = new RegExp(rule.regex).exec(source)
        if (capture) {
          source = source.slice(capture[0].length)
          status = rule.pop ? 2 : 1
          index += capture[0].length
          let content = []
          if (rule.push) {
            const subtoken = this.parse(source, rule.push)
            source = source.slice(subtoken.index)
            index += subtoken.index
            content = subtoken.content
          }
          if (unmatch) {
            result.push({ type: 'default', text: unmatch })
            unmatch = ''
          }
          let data = this.getToken(rule, capture, content)
          if (data) {
            data.type = data.type || rule.type
            result.push(data)
          }
          break
        }
      }
      if (!status && source) {
        unmatch += source.charAt(0)
        source = source.slice(1)
        index += 1
      }
      if (status === 2) break
    }
    if (unmatch) result.push({ type: 'default', text: unmatch })

    this.context = _context
    return {
      index: index,
      content: result
    }
  }
}

module.exports = Lexer
