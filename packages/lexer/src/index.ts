import {
  StringLike,
  LexerMacros,
  LexerConfig,
  LexerRule,
  LexerInstance,
  LexerRegexRule,
  InlineLexerInstance,
  TokenLike,
  MatchStatus,
  parseRule,
  getString,
} from '@marklet/core'

export interface LexerOptions {
  /** lexer rule regex macros */
  macros?: LexerMacros
  /** entrance context */
  entrance?: string
  /** default inline context */
  inlineEntrance?: string
  /** assign start/end to tokens */
  requireBound?: boolean
  /** other configurations */
  config?: LexerConfig
}

type NativeLexerContext = LexerRegexRule[] | InlineLexerInstance
export type LexerContexts = Record<string, LexerRule<StringLike, Lexer>[] | InlineLexerInstance>

interface LexerResult {
  index: number
  result: TokenLike[]
}

export class Lexer implements LexerInstance {
  config: LexerConfig
  private contexts: Record<string, LexerRule[] | InlineLexerInstance> = {}
  private entrance: string
  private inlineEntrance: string
  private requireBound: boolean

  constructor(contexts: LexerContexts, options: LexerOptions = {}) {
    this.config = options.config || {}
    this.entrance = options.entrance || 'main'
    this.inlineEntrance = options.inlineEntrance || 'text'
    this.requireBound = !!options.requireBound

    const _macros = options.macros || {}
    const macros: Record<string, string> = {}
    for (const key in _macros) {
      macros[key] = getString(_macros[key])
    }
    for (const key in contexts) {
      const context = contexts[key]
      this.contexts[key] = context instanceof Array
        ? context.map(rule => parseRule(rule, macros))
        : context
    }
  }

  private getContext(context: string | InlineLexerInstance | LexerRule[], strictMode?: boolean) {
    const result = typeof context === 'string' ? this.contexts[context] : context
    if (!result) throw new Error(`Context '${context}' was not found.`)
    if (result instanceof Array) {
      for (let i = result.length - 1; i >= 0; i -= 1) {
        const rule: LexerRule = result[i]
        if ('include' in rule) {
          const includes = this.getContext(rule.include)
          if (includes instanceof Array) {
            result.splice(i, 1, ...includes)
          } else {
            result.splice(i, 1, {
              regex: /^(?=[\s\S])/,
              push: rule.include,
              strict: true,
            })
          }
        }
      }
      if (strictMode) {
        result.push({
          regex: /^(?=[\s\S])/,
          pop: true,
        })
      }
    }
    return result as NativeLexerContext
  }

  private _parse(source: string, context: NativeLexerContext, isTopLevel?: boolean): LexerResult {
    let index = 0, unmatch = ''
    const result: TokenLike[] = []

    // apply inline lexer
    if (!(context instanceof Array)) {
      const result = context.parse(source)
      return {
        index: result.index,
        result: [result.output],
      }
    }

    while (source) {
      let status: MatchStatus = MatchStatus.NO_MATCH
      for (const rule of context) {
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
          const context = this.getContext(push, rule.strict)
          const subtoken = this._parse(source, context)
          content = subtoken.result.map((tok) => {
            if (this.requireBound && typeof tok === 'object') {
              tok.start += index
              tok.end += index
            }
            return tok
          })
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
    return { index, result }
  }

  inline(source: string, context: string = this.inlineEntrance): string {
    const inlineContext = this.getContext(context)
    if (inlineContext instanceof Array) {
      throw new Error(`'${context}' is not a inline context.`)
    }
    return inlineContext.parse(source).output
  }

  parse(source: string, context: string = this.entrance): TokenLike[] {
    const initialContext = this.getContext(context)
    source = source.replace(/\r\n/g, '\n')
    return this._parse(source, initialContext, true).result
  }
}
