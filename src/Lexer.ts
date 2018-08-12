type StringMap<V> = { [key: string]: V }
type ResultMap<T extends StringMap<(...arg: any[]) => any>> = {
  [key in keyof T]: ReturnType<T[key]>
}

type StringLike = string | RegExp
type Capture = RegExpExecArray & ResultMap<GetterFunctionMap>
type GetterFunction = (capture: Capture) => TokenLike
type GetterFunctionMap = StringMap<GetterFunction>
export interface LexerOptions {
  getters?: GetterFunctionMap
  macros?: StringMap<StringLike>
  allowNoMatch?: boolean
  entrance?: string
  [key: string]: any
}

interface LexerToken {
  type?: string
  text?: string
  content?: TokenLike[]
  [key: string]: any
}

type TokenLike = string | LexerToken
interface LexerIncludeRule { include: string }
interface LexerRegexRule<S extends StringLike> {
  /** the regular expression to execute */
  regex: S
  /**
   * a string containing all the rule flags
   * - `b`: when the context begins
   * - `i`: ignore case
   * - `t`: top level context
   */
  flags?: string
  /** default type of the token */
  type?: string
  /** whether the rule is to be executed */
  test?: string | boolean | ((options: LexerOptions) => boolean)
  /** a result token */
  token?: TokenLike | TokenLike[] | ((
    capture: Capture, content: TokenLike[]
  ) => TokenLike | TokenLike[])
  /** the inner context */
  push?: string | LexerRule<S>[]
  /** whether to pop from the current context */
  pop?: boolean
}

type LexerContext = string | NativeLexerRule[]
type LexerRule<S extends StringLike> = LexerRegexRule<S> | LexerIncludeRule
type LooseLexerRule = LexerRule<StringLike>
type NativeLexerRule = LexerRule<RegExp>
export type LexerRules = StringMap<LooseLexerRule[]>

interface LexerResult {
  index: number
  result: TokenLike[]
}

function getString(string: StringLike): string {
  return string instanceof RegExp ? string.source : string
}

export class Lexer {
  private rules: StringMap<NativeLexerRule[]> = {}
  private options: LexerOptions
  static config: LexerOptions = {
    getters: {},
    macros: {},
    entrance: 'main',
    allowNoMatch: true,
  }
  
  constructor(rules: LexerRules, options: LexerOptions = {}) {
    this.options = { ...Lexer.config, ...options }

    const macros: StringMap<string> = {}
    for (const key in this.options.macros) {
      macros[key] = getString(this.options.macros[key])
    }

    function resolve(rule: LooseLexerRule): NativeLexerRule {
      if ('regex' in rule) {
        let src = getString(rule.regex)
        for (const key in macros) {
          src = src.replace(new RegExp(`{{${key}}}`, 'g'), `(?:${macros[key]})`)
        }
        rule.flags = rule.flags || ''
        if (typeof rule.test === 'undefined') rule.test = true
        if (rule.flags.replace(/ibt/g, '')) throw new Error('Invalid rule flags.')
        rule.regex = new RegExp('^' + src, rule.flags.includes('i') ? 'i' : '')
        if (rule.push instanceof Array) rule.push.forEach(resolve)
      }
      return <NativeLexerRule> rule
    }

    for (const key in rules) {
      this.rules[key] = rules[key].map(resolve)
    }
  }

  /** get a new incremental parser */
  getParser(entrance: string = this.options.entrance): Parser {
    return new Parser(this.rules, this.options, entrance)
  }

  /** parse string into general AST */
  parse(source: string): TokenLike[] {
    return this.getParser().parse(source)
  }
}

class Parser {
  private rules: StringMap<NativeLexerRule[]>
  private options: LexerOptions
  private _source: string
  private _result: TokenLike[]

  constructor(rules: StringMap<NativeLexerRule[]>, options: LexerOptions, entrance?: string) {
    this.rules = rules
    this.options = options
    this._source = ''
    this._result = []
    if (entrance) this.options.entrance = entrance
  }

  private getContext(context: LexerContext): LexerRegexRule<RegExp>[] {
    const result = typeof context === 'string' ? this.rules[context] : context
    for (let i = result.length - 1; i >= 0; i -= 1) {
      const rule: NativeLexerRule = result[i]
      if ('include' in rule) {
        result.splice(i, 1, ...this.getContext(rule.include))
      }
    }
    return <LexerRegexRule<RegExp>[]> result
  }

  private getTestResult(rule: LexerRegexRule<RegExp>): boolean {
    if (typeof rule.test === 'boolean') {
      return rule.test
    } else if (typeof rule.test === 'string') {
      return this.options[rule.test]
    } else {
      return rule.test(this.options)
    }
  }

  private getToken(
    rule: LexerRegexRule<RegExp>,
    capture: RegExpExecArray,
    content: TokenLike[]
  ): TokenLike {
    let result: TokenLike | TokenLike[]
    if (typeof rule.token === 'function') {
      for (const key in this.options.getters) {
        Object.defineProperty(capture, key, {
          get: () => this.options.getters[key].call(this, capture)
        })
      }
      result = rule.token.call(this, capture, content)
    } else if (rule.token) {
      result = rule.token
    } else if (rule.push) {
      result = content
    } else if (!rule.pop) {
      result = capture[0]
    }
    return result instanceof Array ? { content: result } : result
  }

  private _parse(source: string, context: LexerContext, isTop = false): LexerResult {
    let index = 0, unmatch = ''
    const result: TokenLike[] = []
    const rules = this.getContext(context)
    source = source.replace(/\r\n/g, '\n')
    const _source = source
    while (source) {
      /**
       * Matching status:
       * 0. No match was found
       * 1. Found match and continue
       * 2. Found match and pop
       */
      let status = 0
      for (const rule of rules) {
        if (rule.flags.includes('t') && !isTop) continue
        if (rule.flags.includes('b') && index) continue
        if (!this.getTestResult(rule)) continue
        const capture = rule.regex.exec(source)
        if (!capture) continue
        source = source.slice(capture[0].length)
        status = rule.pop ? 2 : 1
        const start = index
        index += capture[0].length
        let content: TokenLike[] = []
        if (rule.push) {
          const subtoken = this._parse(source, rule.push, false)
          source = source.slice(subtoken.index)
          index += subtoken.index
          content = subtoken.result
        }
        if (unmatch) {
          result.push(unmatch)
          unmatch = ''
        }
        const token = this.getToken(rule, capture, content)
        if (token) {
          if (typeof token === 'object') {
            token.type = token.type || rule.type
            token.start = start
            token.end = index
          }
          result.push(token)
        }
        break
      }
      if (!status) {
        if (!this.options.allowNoMatch) {
          throw new Error(`No match was found at '${source.slice(0, 20)}'.`)
        }
        unmatch += source.charAt(0)
        source = source.slice(1)
        index += 1
      }
      if (status === 2) break
    }
    if (unmatch) result.push(unmatch)
    if (isTop) {
      this._source = _source
      this._result = result
    }
    return { index, result }
  }

  /** parse string to incremental AST */
  parse(source: string): TokenLike[] {
    return this._parse(source, this.options.entrance, true).result
  }
}
