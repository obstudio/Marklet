type LexerContext = Array<LexerRule | {include: string}>

interface LexerRule {
  type?: string
  regex: string | RegExp
  token: string | Function
  push?: string | LexerContext
  pop?: boolean
}

interface LexerToken {
  type: string
  text?: string
  content?: LexerToken[]
  [key: string]: any
}

/** Marklet Main Lexer */
class Lexer {
  options: object
  rules: {[key: string]: LexerContext}

  /** Lexer Constructor */
  constructor(rules: object, macros: object = {}, options: object = {}) {
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

    this.rules = {}
    for (const key in rules) {
      this.rules[key] = rules[key].map(resolve)
    }

    this.options = options
  }

  getContext(context: string | LexerContext): LexerRule[] {
    function* walk(context) {
      let result = typeof context === 'string'
        ? this.rules[context]
        : context
      for (const rule of result) {
        if (rule.include) {
          yield* walk(rule.include)
        } else {
          yield rule
        }
      }
    }
    return Array.from(walk(context))
  }

  getToken(
    token: string | Function,
    capture: RegExpExecArray,
    content: LexerToken[]
  ): LexerToken {
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

  parse(source: string, context: string | LexerContext) {
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
          let data = this.getToken(rule.token, capture, content)
          if (data) {
            data.type = data.type || rule.type
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
