class Lexer {
  /**
   * Lexer Constructor
   * @param {Array} rules Lexing rules
   * @param {object} macros Macro rules
   * @param {object} options Lexing options
   */
  constructor(rules, macros, options) {
    function resolve(rule) {
      if (rule.regex) {
        let src = rule.regex.source
        for (const key in macros) {
          src = src.replace(new RegExp(`{{${key}}}`, 'g'), `(?:${macros[key]})`)
        }
        rule.regex = new RegExp(src)
      }
      if (rule.push instanceof Array) rule.push.forEach(resolve)
      return rule
    }

    /**
     * Lexing rules
     */
    this.rules = {}
    for (const key in rules) {
      this.rules[key] = rules[key].map(resolve)
    }

    /**
     * Lexing options
     */
    this.options = options
  }

  /**
   * get context
   * @param {string|Array<LexerRule>} context context
   * @returns {Generator}
   */
  * getContext(context) {
    let result = context
    if (typeof context === 'string') {
      if (context in this.rules) {
        result = this.rules[context]
      } else {
        result = []
        throw new Error('No such context.')
      }
    }
    for (const rule in result) {
      if (rule.include) {
        yield* this.getContext(rule.include)
      } else {
        yield rule
      }
    }
  }

  /**
   * get token
   * @param {string|Function} token token function
   * @param {RegExpExecArray} capture capture
   * @param {Array<Token>} content inner tokens
   * @returns {Token}
   */
  getToken(token, capture, content) {
    let result
    if (typeof token === 'string') {
      result = token
    } else if (token instanceof Function) {
      result = token.call(this, capture, content)
    }
    if (result instanceof Array) {
      result = { content: result }
    } else if (typeof result === 'string') {
      result = { text: result }
    }
    return result
  }

  /**
   * @param {string} source Source text
   * @param {string} context Lexing context
   */
  parse(source, context) {
    let index = 0
    const result = []
    const rules = this.getContext(context)
    while (source) {
      /**
       * Matching status:
       * 0. No match was found
       * 1. Found match and continue
       * 2. Found match and pop
       */
      let status = 0
      for (const rule of rules) {
        const capture = rule.regex.exec(source)
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
          let data = this.getToken(rule.token, capture, content)
          if (data) {
            data.type = data.type || rule.key
            result.push(data)
          }
          break
        }
      }
      if (!status && source) {
        throw new Error('Infinite loop encountered.')
      }
      if (status === 2) break
    }
    return {
      index: index,
      content: result
    }
  }
}

module.exports = Lexer
