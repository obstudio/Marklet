export type StringLike = string | RegExp
export type TokenLike = string | LexerToken

export type LexerConfig = Record<string, any>
export type LexerMacros<S extends StringLike = StringLike> = Record<string, S>

export interface LexerToken {
  type?: string
  text?: string
  content?: TokenLike[]
  start?: number
  end?: number
  [key: string]: any
}

export type LexerRule<
  S extends StringLike = StringLike,
  T extends Lexer<any> = Lexer<any>,
  R extends RegExpExecArray = RegExpExecArray,
> = LexerIncludeRule | LexerMetaRule | LexerRegexRule<S, T, R>

export interface LexerMetaRule { meta: string }

export interface LexerIncludeRule { include: string }

export interface LexerRegexRule<
  S extends StringLike = RegExp,
  T extends Lexer<any> = Lexer<any>,
  R extends RegExpExecArray = RegExpExecArray,
> {
  /** the regular expression to execute */
  regex?: S
  /** an regex placed at the beginning of inner context */
  prefix_regex?: S | ((this: T, capture: R) => StringLike)
  /**
   * a string containing all the rule flags:
   * - `b`: match when the context begins
   * - `e`: match end of line
   * - `i`: ignore case
   * - `p`: pop from the current context
   * - `s`: strict mode
   * - `t`: match top level context
   */
  flags?: string
  /** default type of the token */
  type?: string
  /** whether the rule is to be executed */
  test?: string | boolean | ((this: T, config: LexerConfig) => boolean)
  /** a result token */
  token?: TokenLike | ((this: T, capture: R, content: TokenLike[], config: LexerConfig) => TokenLike)
  /** token scope */
  scope?: string
  /** token scope mapped with captures */
  captures?: Record<number, string>
  /** the inner context */
  push?: string | LexerRule<S, T, R> | LexerRule<S, T, R>[]
  /** pop from the current context */
  pop?: boolean | ((this: T, capture: R) => boolean)
  /** strict mode: pop when no match is found */
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

export class MacroMap {
  private data: Record<string, { regex: RegExp, macro: string }> = {}

  constructor(macros: Record<string, StringLike> = {}) {
    for (const key in macros) {
      this.data[key] = {
        regex: new RegExp(`{{${key}}}`, 'g'),
        macro: `(?:${getString(macros[key])})`,
      }
    }
  }

  resolve(source: StringLike): string {
    source = getString(source)
    for (const key in this.data) {
      source = source.replace(this.data[key].regex, this.data[key].macro)
    }
    return source
  }
}

const noMacro = new MacroMap()

/** transform a string-like object into a raw string */
export function getString(source: StringLike): string {
  return source instanceof RegExp ? source.source : source
}

export function isStringLike(source: any): boolean {
  return typeof source === 'string' || source instanceof RegExp
}

/** transform lexer rules with string into ones with regexp */
export function parseRule(rule: LexerRule, macros: MacroMap = noMacro): LexerRule<RegExp> {
  if (!('include' in rule || 'meta' in rule)) {
    if (rule.regex === undefined) {
      rule.regex = /(?=[\s\S])/
      if (!rule.type) rule.type = 'default'
    }
    if (rule.test === undefined) rule.test = true
    let source = macros.resolve(rule.regex)
    let flags = ''
    rule.flags = rule.flags || ''
    if (rule.flags.replace(/[biepst]/g, '')) {
      throw new Error(`'${rule.flags}' contains invalid rule flags. (invalid-flags)`)
    }
    if (rule.flags.includes('s')) rule.strict = true
    if (rule.flags.includes('b')) rule.context_begins = true
    if (rule.flags.includes('t')) rule.top_level = true
    if (rule.flags.includes('p') && !rule.pop) rule.pop = true
    if (rule.flags.includes('e') || rule.eol) source += '[ \t]*(?:\n+|$)'
    if (rule.flags.includes('i') || rule.ignore_case) flags += 'i'
    rule.regex = new RegExp('^(?:' + source + ')', flags)
    const prefix = rule.prefix_regex
    if (isStringLike(prefix)) {
      rule.prefix_regex = new RegExp(`^(?:${macros.resolve(prefix as StringLike)})`)
    }
    const push = rule.push
    if (push instanceof Array) {
      push.forEach(_rule => parseRule(_rule, macros))
    } else if (typeof push === 'object') {
      rule.push = parseRule(push, macros)
    }
  }
  return rule as LexerRule<RegExp>
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
  public meta: LexerMeta<R>
  public config: LexerConfig

  constructor(config?: LexerConfig) {
    this.config = config || {}
  }

  initialize?(...args: any[]): void | LexerResult<R>
  getCapture?(rule: LexerRegexRule, capture: RegExpExecArray): RegExpExecArray
  getContent?(rule: LexerRegexRule, capture: RegExpExecArray): TokenLike[]
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
    if (final) return this.meta = _meta, final
    
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
        let pop = rule.pop
        if (typeof pop === 'function') pop = pop.call(this, capture)
        status = pop ? MatchStatus.POP : MatchStatus.CONTINUE

        // Step 4: get inner tokens
        const content = rule.push && this.getContent ? this.getContent(rule, capture) : []

        // Step 5: detect endless loop
        if (!rule.pop && this.meta.start === this.meta.index) {
          throw new Error(`Endless loop at '${
            this.meta.source.slice(0, 10)
          } ${
            this.meta.source.length > 10 ? '...' : ''
          }'. (endless-loop)`)
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
