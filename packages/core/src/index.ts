export type StringLike = string | RegExp

export type LexerConfig = Record<string, any>
export type LexerMacros = Record<string, StringLike>

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
  T extends LexerClass = LexerClass,
  R extends RegExpExecArray = RegExpExecArray,
> = LexerIncludeRule | LexerRegexRule<S, T, R>

export interface LexerIncludeRule { include: string }
export interface LexerRegexRule<
  S extends StringLike = StringLike,
  T extends LexerClass = LexerClass,
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
  push?: string | LexerRule<S>[]
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

/** Transform a string-like object into a raw string. */
export function getString(string: StringLike): string {
  return string instanceof RegExp ? string.source : string
}

export function parseRule(rule: LexerRule<StringLike>, macros: LexerMacros = {}): LexerRule {
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
    if (rule.push instanceof Array) rule.push.forEach(_rule => parseRule(_rule, macros))
  }
  return rule as LexerRule
}

export interface LexerClass {
  config: LexerConfig
  parse(source: string): any
}

export enum MatchStatus {
  /** No match was found */
  NO_MATCH,
  /** Found match and continue */
  CONTINUE,
  /** Found match and pop */
  POP,
}
