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

type InlineLexer = Lexer<string>
type DocumentLexerRule = LexerRegexRule<RegExp, DocumentLexer>
type NativeLexerContext = DocumentLexerRule[] | InlineLexer
export type LexerContexts = Record<string, LexerRule<StringLike, DocumentLexer>[] | InlineLexer>

export class DocumentLexer extends Lexer<TokenLike[]> {
  private stackTrace: string[]
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
    strictMode: boolean = false,
    pushStack: boolean = true,
  ) {
    const name = typeof context === 'string' ? context : 'anonymous'
    if (pushStack) {
      this.stackTrace.push(name)
    } else {
      this.stackTrace[this.stackTrace.length - 1] = name
    }
    console.log('PUSH:', this.stackTrace)
    const result = typeof context === 'string' ? this.contexts[context] : context
    if (!result) throw new Error(`Context '${context}' was not found.`)
    if (result instanceof Array) {
      for (let i = result.length - 1; i >= 0; i -= 1) {
        const rule: LexerRule = result[i]
        if ('include' in rule) {
          const includes = this.getContext(rule.include, false, false)
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
      this.stackTrace.pop()
      console.log('POP:', this.stackTrace)
      return {
        index: result.index,
        output: [result.output],
      }
    }
    this.meta.output = []
    this.meta.context = context
  }

  getContent(rule: DocumentLexerRule) {
    const context = this.getContext(rule.push, rule.strict)
    const result = this.run(this.meta.source, false, context)
    const content = result.output.map((token) => {
      if (this.requireBound && typeof token === 'object') {
        token.start += this.meta.index
        token.end += this.meta.index
      }
      return token
    })
    this.stackTrace.pop()
    console.log('POP:', this.stackTrace)
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
    const inlineContext = this.getContext(context)
    if (inlineContext instanceof Array) {
      throw new Error(`'${context}' is not a inline context.`)
    }
    const result = inlineContext.run(source).output
    this.stackTrace.pop()
    console.log('POP:', this.stackTrace)
    return result
  }

  parse(source: string, context: string = this.entrance): TokenLike[] {
    this.stackTrace = []
    const initialContext = this.getContext(context)
    source = source.replace(/\r\n/g, '\n')
    try {
      return this.run(source, true, initialContext).output
    } catch (error) {
      console.log(this.stackTrace)
      console.error(error)
    }
  }
}
