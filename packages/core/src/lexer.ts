export type StringLike = string | RegExp

export type LexerConfig = Record<string, any>
export type LexerMacros<S extends StringLike = StringLike> = Record<string, S>

export type TokenLike = string | LexerToken
export interface LexerToken {
  type?: string
  text?: string
  content?: TokenLike[]
  start?: number
  end?: number
  [key: string]: any
}

export type LexerRule<
  S extends StringLike = RegExp,
  T extends Lexer<any> = Lexer<any>,
  R extends RegExpExecArray = RegExpExecArray,
> = LexerIncludeRule | LexerRegexRule<S, T, R>

export interface LexerIncludeRule { include: string }
export interface LexerRegexRule<
  S extends StringLike = RegExp,
  T extends Lexer<any> = Lexer<any>,
  R extends RegExpExecArray = RegExpExecArray,
> {
  /** the regular expression to execute */
  regex?: S
  /**
   * a string containing all the rule flags:
   * - `b`: match when the context begins
   * - `e`: match end of line
   * - `i`: ignore case
   * - `p`: pop from the current context
   * - `s`: pop when no match is found
   * - `t`: match top level context
   */
  flags?: string
  /** default type of the token */
  type?: string
  /** whether the rule is to be executed */
  test?: string | boolean | ((this: T, config: LexerConfig) => boolean)
  /** a result token */
  token?: TokenLike | TokenLike[] | ((
    this: T, capture: R, content: TokenLike[]
  ) => TokenLike | TokenLike[])
  /** the inner context */
  push?: string | LexerRule<S, T, R>[]
  /** pop from the current context */
  pop?: boolean
  /** pop when no match is found */
  strict?: boolean
  /** match when the context begins */
  context_begins?: boolean
  /** match top level context */
  top_level?: boolean
  /** whether to ignore case */
  ignore_case?: boolean
  /** match end of line */
  eol?: boolean
}

/** transform a string-like object into a raw string */
export function getString(string: StringLike): string {
  return string instanceof RegExp ? string.source : string
}

/** transform lexer rules with string into ones with regexp */
export function parseRule(rule: LexerRule<StringLike>, macros: LexerMacros<string> = {}): LexerRule {
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
    if (rule.flags.replace(/[biepst]/g, '')) {
      throw new Error(`'${rule.flags}' contains invalid rule flags.`)
    }
    if (rule.flags.includes('p')) rule.pop = true
    if (rule.flags.includes('s')) rule.strict = true
    if (rule.flags.includes('b')) rule.context_begins = true
    if (rule.flags.includes('t')) rule.top_level = true
    if (rule.flags.includes('e') || rule.eol) src += ' *(?:\\n+|$)'
    if (rule.flags.includes('i') || rule.ignore_case) flags += 'i'
    rule.regex = new RegExp('^(?:' + src + ')', flags)
    if (rule.push instanceof Array) rule.push.forEach(_rule => parseRule(_rule, macros))
  }
  return rule as LexerRule
}

enum MatchStatus {
  /** No match was found */
  NO_MATCH,
  /** Found match and continue */
  CONTINUE,
  /** Found match and pop */
  POP,
}

export interface LexerResult<R extends string | TokenLike[]> {
  /** current index of the source string */
  index: number
  /** output string or array */
  output: R
}

export interface LexerMeta<R extends string | TokenLike[]> extends Partial<LexerResult<R>> {
  /** record where the match starts */
  start?: number
  /** a copy of source string */
  source?: string
  /** a string collecting unmatch chars */
  unmatch?: string
  /** whether running at top level */
  isTopLevel?: boolean
  /** current lexing context */
  context?: LexerRegexRule[]
}

export abstract class Lexer<R extends string | TokenLike[]> {
  meta: LexerMeta<R>
  config: LexerConfig

  constructor(config: LexerConfig) {
    this.config = config || {}
  }

  initialize?(...args: any[]): void | LexerResult<R>
  getCapture?(rule: LexerRegexRule, capture: RegExpExecArray): RegExpExecArray
  getContent?(rule: LexerRegexRule): TokenLike[]
  pushToken?(rule: LexerRegexRule, capture: RegExpExecArray, content: TokenLike[]): void
  pushUnmatch?(): void

  run(source: string, isTopLevel?: boolean, ...args: any[]): LexerResult<R> {
    // store meta data from lower level
    const _meta = this.meta
    this.meta = {
      source,
      isTopLevel,
      index: 0,
      unmatch: '',
    }

    // initialize or simply get the result
    const final = this.initialize(...args)
    if (final) return final
    
    // walk through the source string
    while (this.meta.source) {
      let status: MatchStatus = MatchStatus.NO_MATCH
      for (const rule of this.meta.context) {
        // Step 1: test before matching
        if (rule.top_level && !this.meta.isTopLevel) continue
        if (rule.context_begins && this.meta.index) continue
        
        let test = rule.test
        if (typeof test === 'string') {
          if (test.charAt(0) === '!') {
            test = !this.config[test.slice(1)]
          } else {
            test = !!this.config[test]
          }
        } else if (typeof test === 'function') {
          test = !!test.call(this, this.config)
        }
        if (!test) continue

        // Step 2: exec regex and get capture
        const match = rule.regex.exec(this.meta.source)
        if (!match) continue
        this.meta.source = this.meta.source.slice(match[0].length)
        this.meta.start = this.meta.index
        this.meta.index += match[0].length
        const capture = this.getCapture ? this.getCapture(rule, match) : match

        // Step 3: reset match status
        status = rule.pop ? MatchStatus.POP : MatchStatus.CONTINUE

        // Step 4: get inner tokens
        const content = rule.push && this.getContent ? this.getContent(rule) : []

        // Step 5: detect endless loop
        if (!rule.pop && this.meta.start === this.meta.index) {
          throw new Error(`Endless loop at '${
            this.meta.source.slice(0, 10)
          } ${
            this.meta.source.length > 10 ? '...' : ''
          }'.`)
        }

        // Step 6: handle unmatched chars
        if (this.pushUnmatch && this.meta.unmatch) {
          this.pushUnmatch()
          this.meta.unmatch = ''
        }

        // Step 7: push generated token
        this.pushToken(rule, capture, content)

        // Step 8: break loop
        break
      }

      if (status === MatchStatus.POP) break
      if (status === MatchStatus.NO_MATCH) {
        this.meta.unmatch += this.meta.source.charAt(0)
        this.meta.source = this.meta.source.slice(1)
        this.meta.index += 1
      }
    }

    // handle ramaining unmatched chars
    if (this.pushUnmatch && this.meta.unmatch) this.pushUnmatch()

    const result: LexerResult<R> = {
      index: this.meta.index,
      output: this.meta.output,
    }

    // restore meta data for lower level
    this.meta = _meta
    return result
  }
}