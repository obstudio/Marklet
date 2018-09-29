import {
  StringLike,
  LexerMacros,
  LexerConfig,
  LexerClass,
  LexerRule,
  TokenLike,
  LexerRegexRule,
  MatchStatus,
  parseRule,
  getString,
} from '@marklet/core'

export { LexerConfig }

export interface LexerOptions {
  /** lexer rule regex macros */
  macros?: LexerMacros
  /** entrance context */
  entrance?: string
  /** default context */
  default?: string
  /** assign start/end to tokens */
  requireBound?: boolean
  /** other configurations */
  config?: LexerConfig
}

interface LexerWarning {
  message: string
}

type LexerContext = string | LexerRule[]
export type LexerRules = Record<string, LexerRule<StringLike>[]>

interface LexerResult {
  index: number
  result: TokenLike[]
  warnings: LexerWarning[]
}

export class Lexer implements LexerClass {
  config: LexerConfig
  private rules: Record<string, LexerRule[]> = {}
  private entrance: string
  private default: string
  private requireBound: boolean
  private _warnings: LexerWarning[]
  private _isRunning: boolean = false

  constructor(rules: LexerRules, options: LexerOptions = {}) {
    this.config = options.config || {}
    this.entrance = options.entrance || 'main'
    this.default = options.default || 'text'
    this.requireBound = !!options.requireBound

    const _macros = options.macros || {}
    const macros: Record<string, string> = {}
    for (const key in _macros) {
      macros[key] = getString(_macros[key])
    }
    for (const key in rules) {
      this.rules[key] = rules[key].map(rule => parseRule(rule, macros))
    }
  }

  private getContext(context: LexerContext): LexerRegexRule<RegExp>[] {
    const result = typeof context === 'string' ? this.rules[context] : context
    if (!result) throw new Error(`Context '${context}' was not found.`)
    for (let i = result.length - 1; i >= 0; i -= 1) {
      const rule: LexerRule = result[i]
      if ('include' in rule) {
        result.splice(i, 1, ...this.getContext(rule.include))
      }
    }
    return result as LexerRegexRule<RegExp>[]
  }

  private _parse(source: string, context: LexerContext, isTopLevel: boolean = false): LexerResult {
    let index = 0, unmatch = ''
    const result: TokenLike[] = []
    const rules = this.getContext(context)
    const warnings: LexerWarning[] = this._warnings = []
    while (source) {
      let status: MatchStatus = MatchStatus.NO_MATCH
      for (const rule of rules) {
        if (rule.top_level && !isTopLevel) continue
        if (rule.context_begins && index) continue

        // test
        let test = rule.test
        if (typeof test === 'string') {
          if (test.charAt(0) === '!') {
            test = !this.config[test.slice(1)]
          } else {
            test = !!this.config[test]
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
        status = pop ? MatchStatus.POP : MatchStatus.CONTINUE

        // push
        let content: TokenLike[] = [], push = rule.push
        if (push) {
          const subtoken = this._parse(source, <LexerContext>push)
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

      if (status === MatchStatus.POP) break
      if (status === MatchStatus.NO_MATCH) {
        unmatch += source.charAt(0)
        source = source.slice(1)
        index += 1
      }
    }

    if (unmatch) result.push(unmatch)
    return { index, result, warnings }
  }

  pushWarning(message: string) {
    this._warnings.push({ message })
  }

  parse(source: string, context?: string): TokenLike[] {
    let result
    source = source.replace(/\r\n/g, '\n')
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