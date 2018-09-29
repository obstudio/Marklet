import {
  Lexer,
  parseRule,
  getString,
  StringLike,
  TokenLike,
  LexerMacros,
  LexerConfig,
  LexerRule,
  LexerRegexRule,
} from './lexer'

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

type InlineLexer = Lexer<string>
type DocumentLexerRule = LexerRegexRule<RegExp, DocumentLexer>
type NativeLexerContext = DocumentLexerRule[] | InlineLexer
export type LexerContexts = Record<string, LexerRule<StringLike, DocumentLexer>[] | InlineLexer>

enum ContextReason {
  INCLUDE,
  PUSH,
  INLINE,
  INITIAL,
}

interface ContextLog {
  name: string
  reason: ContextReason
}

export class DocumentLexer extends Lexer<TokenLike[]> {
  private stackTrace: ContextLog[]
  private contexts: Record<string, LexerRule[] | InlineLexer> = {}
  private entrance: string
  private inlineEntrance: string
  private requireBound: boolean

  constructor(contexts: LexerContexts, options: LexerOptions = {}) {
    super(options.config)
    this.entrance = options.entrance || 'main'
    this.inlineEntrance = options.inlineEntrance || 'text'
    this.requireBound = !!options.requireBound

    const _macros = options.macros || {}
    const macros: LexerMacros<string> = {}
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

  getContext(
    context: string | InlineLexer | LexerRule[],
    reason: ContextReason,
    strictMode: boolean = false,
  ) {
    const name = typeof context === 'string' ? context : 'anonymous'
    if (reason === ContextReason.INITIAL) {
      this.stackTrace = [{ name, reason }]
    } else if (reason !== ContextReason.INCLUDE) {
      this.stackTrace.push({ name, reason })
    } else {
      this.stackTrace[this.stackTrace.length - 1].name = name
    }
    const result = typeof context === 'string' ? this.contexts[context] : context
    if (!result) throw new Error(`Context '${context}' was not found.`)
    if (result instanceof Array) {
      for (let i = result.length - 1; i >= 0; i -= 1) {
        const rule: LexerRule = result[i]
        if ('include' in rule) {
          const includes = this.getContext(rule.include, ContextReason.INCLUDE)
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

  initialize(context: NativeLexerContext) {
    if (!(context instanceof Array)) {
      const result = context.run(this.meta.source)
      return {
        index: result.index,
        output: [result.output],
      }
    }
    this.meta.output = []
    this.meta.context = context
  }

  getContent(rule: DocumentLexerRule) {
    const context = this.getContext(rule.push, ContextReason.PUSH, rule.strict)
    const result = this.run(this.meta.source, false, context)
    const content = result.output.map((token) => {
      if (this.requireBound && typeof token === 'object') {
        token.start += this.meta.index
        token.end += this.meta.index
      }
      return token
    })
    this.stackTrace.pop()
    this.meta.source = this.meta.source.slice(result.index)
    this.meta.index += result.index
    return content
  }

  pushUnmatch() {
    this.meta.output.push(this.meta.unmatch)
  }

  pushToken(rule: DocumentLexerRule, capture: RegExpExecArray, content: TokenLike[]) {
    let token = rule.token
    if (typeof token === 'function') {
      token = token.call(this, capture, content)
    } else if (token === undefined) {
      if (rule.push) {
        token = content
      } else if (!rule.pop) {
        token = capture[0]
      }
    }
    if (token instanceof Array) {
      token = { content: token }
    }
    if (token) {
      if (typeof token === 'object') {
        token.type = token.type || rule.type
        if (this.requireBound) {
          token.start = this.meta.start
          token.end = this.meta.index
        }
      }
      this.meta.output.push(token)
    }
  }

  inline(source: string, context: string = this.inlineEntrance): string {
    const inlineContext = this.getContext(context, ContextReason.INLINE)
    if (inlineContext instanceof Array) {
      throw new Error(`'${context}' is not a inline context.`)
    }
    const result = inlineContext.run(source).output
    this.stackTrace.pop()
    return result
  }

  parse(source: string, context: string = this.entrance): TokenLike[] {
    const initialContext = this.getContext(context, ContextReason.INITIAL)
    source = source.replace(/\r\n/g, '\n')
    try {
      return this.run(source, true, initialContext).output
    } catch (error) {
      console.log(this.stackTrace)
      console.error(error)
    }
  }
}
