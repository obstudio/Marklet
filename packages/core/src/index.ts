export type StringMap<V> = { [key: string]: V }
type ResultMap<T extends StringMap<(...arg: any[]) => any>> = {
  [key in keyof T]: ReturnType<T[key]>
}

type StringLike = string | RegExp
type Capture = RegExpExecArray & ResultMap<GetterFunctionMap>
type GetterFunction = (capture: RegExpExecArray) => any
type GetterFunctionMap = StringMap<GetterFunction>
export interface LexerConfig { [key: string]: any }
export interface LexerOptions {
  /** lexer capture getters */
  getters?: GetterFunctionMap
  /** lexer rule regex macros */
  macros?: StringMap<StringLike>
  /** entrance context */
  entrance?: string
  /** default context */
  default?: string
  /** assign start/end to tokens */
  requireBound?: boolean
  /** other configurations */
  config?: LexerConfig
}

export interface LexerToken {
  type?: string
  text?: string
  content?: TokenLike[]
  start?: number
  end?: number
  [key: string]: any
}

export type TokenLike = string | LexerToken
interface LexerIncludeRule { include: string }
interface LexerRegexRule<S extends StringLike> {
  /** the regular expression to execute */
  regex?: S
  /**
   * a string containing all the rule flags:
   * - `b`: match when the context begins
   * - `e`: match end of line
   * - `i`: ignore case
   * - `p`: pop from the current context
   * - `t`: match top level context
   */
  flags?: string
  /** default type of the token */
  type?: string
  /** whether the rule is to be executed */
  test?: string | boolean | ((config: LexerConfig) => boolean)
  /** a result token */
  token?: TokenLike | TokenLike[] | ((
    this: Lexer, capture: Capture, content: TokenLike[], rule: this
  ) => TokenLike | TokenLike[])
  /** the inner context */
  push?: string | LexerRule<S>[] | ((
    this: Lexer, capture: Capture
  ) => string | LexerRule<S>[] | false)
  /** pop from the current context */
  pop?: boolean
  /** match when the context begins */
  context_begins?: boolean
  /** match top level context */
  top_level?: boolean
  /** whether to ignore case */
  ignore_case?: boolean
  /** match end of line */
  eol?: boolean
}

interface LexerWarning {
  message: string
}

type LexerContext = string | NativeLexerRule[]
type LexerRule<S extends StringLike> = LexerRegexRule<S> | LexerIncludeRule
type LooseLexerRule = LexerRule<StringLike>
type NativeLexerRule = LexerRule<RegExp>
export type LexerRules = StringMap<LooseLexerRule[]>

function getString(string: StringLike): string {
  return string instanceof RegExp ? string.source : string
}

export class Lexer {
  config: LexerConfig
  private rules: StringMap<NativeLexerRule[]> = {}
  private getters: GetterFunctionMap
  private entrance: string
  private default: string
  private requireBound: boolean
  private _warnings: LexerWarning[]
  private _isRunning: boolean = false
  
  constructor(rules: LexerRules, options: LexerOptions = {}) {
    this.getters = options.getters || {}
    this.config = options.config || {}
    this.entrance = options.entrance || 'main'
    this.default = options.default || 'text'
    this.requireBound = !!options.requireBound 

    const _macros = options.macros || {}
    const macros: StringMap<string> = {}
    for (const key in _macros) {
      macros[key] = getString(_macros[key])
    }

    function resolve(rule: LooseLexerRule): NativeLexerRule {
      if (!('include' in rule)) {
        if (rule.regex === undefined) {
          rule.regex = /(?=[\s\S])/
          if (!rule.type) rule.type = 'default'
        }
        if (rule.test === undefined) rule.test = true
        let src = getString(rule.regex)
        let flags = ''
        for (const key in macros) {
          src = src.replace(new RegExp(`{{${key}}}`, 'g'), `(?:${macros[key]})`)
        }
        rule.flags = rule.flags || ''
        if (rule.flags.replace(/[biept]/g, '')) {
          throw new Error(`'${rule.flags}' contains invalid rule flags.`)
        }
        if (rule.flags.includes('p')) rule.pop = true
        if (rule.flags.includes('b')) rule.context_begins = true
        if (rule.flags.includes('t')) rule.top_level = true
        if (rule.flags.includes('e') || rule.eol) src += ' *(?:\\n+|$)'
        if (rule.flags.includes('i') || rule.ignore_case) flags += 'i'
        rule.regex = new RegExp('^(?:' + src + ')', flags)
        if (rule.push instanceof Array) rule.push.forEach(resolve)
      }
      return <NativeLexerRule> rule
    }

    for (const key in rules) {
      this.rules[key] = rules[key].map(resolve)
    }
  }

  private getContext(context: LexerContext): LexerRegexRule<RegExp>[] {
    const result = typeof context === 'string' ? this.rules[context] : context
    if (!result) throw new Error(`Context '${context}' was not found.`)
    for (let i = result.length - 1; i >= 0; i -= 1) {
      const rule: NativeLexerRule = result[i]
      if ('include' in rule) {
        result.splice(i, 1, ...this.getContext(rule.include))
      }
    }
    return <LexerRegexRule<RegExp>[]> result
  }

  private _parse(source: string, context: LexerContext, isTopLevel: boolean = false): {
    index: number
    result: TokenLike[]
    warnings: LexerWarning[]
  } {
    let index = 0, unmatch = ''
    const result: TokenLike[] = []
    const rules = this.getContext(context)
    const warnings: LexerWarning[] = this._warnings = []
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
        if (rule.top_level && !isTopLevel) continue
        if (rule.context_begins && index) continue

        // test
        let test = rule.test
        if (typeof test === 'string') {
          if (test.charAt(0) === '!') {
            test = !this.config[test.slice(1)]
          } else {
            test = this.config[test]
          }
        } else if (typeof test === 'function') {
          test = test.call(this, this.config)
        }
        if (!test) continue

        // regex
        const capture = rule.regex.exec(source)
        if (!capture) continue
        source = source.slice(capture[0].length)
        const start = index
        index += capture[0].length

        // pop
        const pop = rule.pop
        status = pop ? 2 : 1

        // push
        let content: TokenLike[] = [], push = rule.push
        if (typeof push === 'function') push = push.call(this, capture)
        if (push) {
          const subtoken = this._parse(source, <LexerContext> push)
          content = subtoken.result.map((tok) => {
            if (this.requireBound && typeof tok === 'object') {
              tok.start += index
              tok.end += index
            }
            return tok
          })
          warnings.concat(subtoken.warnings)
          source = source.slice(subtoken.index)
          index += subtoken.index
        }

        // detect error
        if (!pop && index === start) {
          throw new Error(`Endless loop at '${
            source.slice(0, 10)
          } ${
            source.length > 10 ? '...' : ''
          }'.`)
        }

        // resolve unmatch
        if (unmatch) {
          result.push(unmatch)
          unmatch = ''
        }

        // token
        let token = rule.token
        if (typeof token === 'function') {
          for (const key in this.getters) { // redundant define led to some efficiency loss, consider monkey-patch RegExpExecArray or try other solutions?
            Object.defineProperty(capture, key, {
              get: () => this.getters[key].call(this, capture)
            })
          }
          token = token.call(this, capture, content)
        } else if (token === undefined) {
          if (push) {
            token = content
          } else if (!pop) {
            token = capture[0]
          }
        }
        if (token instanceof Array) token = { content: token }
        if (token) {
          if (typeof token === 'object') {
            token.type = token.type || rule.type
            if (this.requireBound) {
              token.start = start
              token.end = index
            }
          }
          result.push(token)
        }

        break
      }

      if (!status) {
        unmatch += source.charAt(0)
        source = source.slice(1)
        index += 1
      }
      if (status === 2) break
    }

    if (unmatch) result.push(unmatch)
    return { index, result, warnings }
  }

  pushWarning(message) {
    this._warnings.push({ message })
  }

  parse(source: string, context?: string): TokenLike[] {
    let result
    if (this._isRunning) {
      result = this._parse(source, context || this.default).result
    } else {
      this._isRunning = true
      result = this._parse(source, context || this.entrance, true).result
      this._isRunning = false
    }
    return result
  }
}