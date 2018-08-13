type StringMap<V> = { [key: string]: V }
type ResultMap<T extends StringMap<(...arg: any[]) => any>> = {
  [key in keyof T]: ReturnType<T[key]>
}

type StringLike = string | RegExp
type Capture = RegExpExecArray & ResultMap<GetterFunctionMap>
type GetterFunction = (capture: RegExpExecArray) => any
type GetterFunctionMap = StringMap<GetterFunction>
export interface LexerOptions {
  /** lexer capture getters */
  getters?: GetterFunctionMap
  /** lexer rule regex macros */
  macros?: StringMap<StringLike>
  /** entrance context */
  entrance?: string
  [key: string]: any
}

interface LexerToken {
  type?: string
  text?: string
  content?: TokenLike[]
  start?: number
  end?: number
  [key: string]: any
}

type TokenLike = string | LexerToken
interface LexerIncludeRule { include: string }
interface LexerRegexRule<S extends StringLike> {
  /** the regular expression to execute */
  regex: S
  /**
   * a string containing all the rule flags
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
  test?: string | boolean | ((options: LexerOptions) => boolean)
  /** a result token */
  token?: TokenLike | TokenLike[] | ((
    capture: Capture, content: TokenLike[]
  ) => TokenLike | TokenLike[])
  /** the inner context */
  push?: string | LexerRule<S>[] | ((
    capture: Capture
  ) => string | LexerRule<S>[] | false)
  /** pop from the current context */
  pop?: boolean | ((capture: Capture) => boolean)
  /** match when the context begins */
  context_begins?: boolean
  /** match top level context */
  top_level?: boolean
  /** whether to ignore case */
  ignore_case?: boolean
  /** match end of line */
  eol?: boolean
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
  }
  
  constructor(rules: LexerRules, options: LexerOptions = {}) {
    this.options = { ...Lexer.config, ...options }

    const macros: StringMap<string> = {}
    for (const key in this.options.macros) {
      macros[key] = getString(this.options.macros[key])
    }

    function resolve(rule: LooseLexerRule): NativeLexerRule {
      if ('regex' in rule) {
        if (typeof rule.test === 'undefined') rule.test = true
        let src = getString(rule.regex)
        let flags = ''
        for (const key in macros) {
          src = src.replace(new RegExp(`{{${key}}}`, 'g'), `(?:${macros[key]})`)
        }
        rule.flags = rule.flags || ''
        if (rule.flags.replace(/[biept]/g, '')) throw new Error('Invalid rule flags.')
        if (rule.flags.includes('p')) rule.pop = true
        if (rule.flags.includes('b')) rule.context_begins = true
        if (rule.flags.includes('t')) rule.top_level = true
        if (rule.flags.includes('e') || rule.eol) src += ' *(?:\\n+|$)'
        if (rule.flags.includes('i') || rule.ignore_case) flags += 'i'
        rule.regex = new RegExp('^' + src, flags)
        if (rule.push instanceof Array) rule.push.forEach(resolve)
      }
      return <NativeLexerRule> rule
    }

    for (const key in rules) {
      this.rules[key] = rules[key].map(resolve)
    }
  }

  /** get a new incremental parser */
  getParser(entrance: string = this.options.entrance, options: LexerOptions = {}): Parser {
    return new Parser(this.rules, { ...this.options, ...options }, entrance)
  }

  /** parse string into general AST */
  parse(source: string): TokenLike[] {
    return this.getParser().parse(source)
  }
}

class Parser {
  private rules: StringMap<NativeLexerRule[]>
  private options: LexerOptions
  private _context: LexerContext

  constructor(rules: StringMap<NativeLexerRule[]>, options: LexerOptions, entrance?: string) {
    this.rules = rules
    this.options = options
    if (entrance) this.options.entrance = entrance
    this._context = this.options.entrance
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

  private _parse(source: string, context: LexerContext = this._context, isTop = false): LexerResult {
    let index = 0, unmatch = ''
    const result: TokenLike[] = []
    const rules = this.getContext(context)
    this._context = rules
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
        if (rule.top_level && !isTop) continue
        if (rule.context_begins && index) continue

        // test
        let test = rule.test
        if (typeof test === 'string') {
          if (test.charAt(0) === '!') {
            test = !this.options[test.slice(1)]
          } else {
            test = this.options[test]
          }
        } else if (typeof test === 'function') {
          test = test.call(this, this.options)
        }
        if (!test) continue

        // regex
        const capture = rule.regex.exec(source)
        if (!capture) continue
        source = source.slice(capture[0].length)
        const start = index
        index += capture[0].length

        // pop
        let pop = rule.pop
        if (typeof pop === 'function') pop = pop.call(this, capture)
        status = pop ? 2 : 1

        // push
        let content: TokenLike[] = [], push = rule.push
        if (typeof push === 'function') push = push.call(this, capture)
        if (push) {
          const subtoken = this._parse(source, <LexerContext> push, false)
          content = subtoken.result.map((tok) => {
            if (typeof tok === 'object') {
              tok.start += index
              tok.end += index
            }
            return tok
          })
          source = source.slice(subtoken.index)
          index += subtoken.index
        }

        // unmatch
        if (unmatch) {
          result.push(unmatch)
          unmatch = ''
        }

        // token
        let token = rule.token
        if (typeof token === 'function') {
          for (const key in this.options.getters) {
            Object.defineProperty(capture, key, {
              get: () => this.options.getters[key].call(this, capture)
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
            token.start = start
            token.end = index
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
    return { index, result }
  }

  /** parse string to incremental AST */
  parse(source: string): TokenLike[] {
    return this._parse(source, this.options.entrance, true).result
  }
}
