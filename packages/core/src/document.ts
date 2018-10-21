import {
  Lexer,
  parseRule,
  StringLike,
  TokenLike,
  MacroMap,
  LexerMacros,
  LexerConfig,
  LexerRule,
  LexerRegexRule,
} from './lexer'

import { InlineLexer } from './inline'

export interface DocumentOptions {
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

type DocumentLexerRule = LexerRegexRule<RegExp, DocumentLexer>
type NativeLexerContext = DocumentLexerRule[] | InlineLexer
export type DocumentContexts = Record<string, LexerRule<StringLike, DocumentLexer>[] | InlineLexer>

enum ContextOperation {
  INCLUDE,
  PUSH,
  INLINE,
  INITIAL,
}

interface ContextLog {
  name: string
  operation: ContextOperation
}

export class DocumentLexer extends Lexer<TokenLike[]> {
  private stackTrace: ContextLog[]
  private contexts: Record<string, LexerRule<RegExp>[] | InlineLexer> = {}
  private entrance: string
  private inlineEntrance: string
  private requireBound: boolean
  private macros: MacroMap

  constructor(contexts: DocumentContexts, options: DocumentOptions = {}) {
    super(options.config)
    this.entrance = options.entrance || 'main'
    this.inlineEntrance = options.inlineEntrance || 'text'
    this.requireBound = !!options.requireBound
    this.macros = new MacroMap(options.macros || {}, this.config)
    
    for (const key in contexts) {
      const context = contexts[key]
      if (context instanceof Array) {
        this.contexts[key] = context.map((rule) => parseRule(rule, this.macros))
      } else {
        this.contexts[key] = context
      }
    }
  }

  getContext(
    context: string | InlineLexer | LexerRule<RegExp> | LexerRule<RegExp>[],
    operation: ContextOperation,
    prefixRegex?: RegExp,
    postfixRegex?: RegExp,
  ) {
    const name = typeof context === 'string' ? context : 'anonymous'
    if (operation === ContextOperation.INITIAL) {
      this.stackTrace = [{ name, operation }]
    } else if (operation !== ContextOperation.INCLUDE) {
      this.stackTrace.push({ name, operation })
    } else {
      this.stackTrace[this.stackTrace.length - 1].name = name
    }
    let rules = typeof context === 'string' ? this.contexts[context] : context
    if (!rules) throw new Error(`Context '${context}' was not found. (context-not-found)`)
    if (rules instanceof InlineLexer) {
      return rules.fork(prefixRegex, postfixRegex)
    } else {
      if (!(rules instanceof Array)) rules = [rules]
      for (let i = rules.length - 1; i >= 0; i -= 1) {
        const rule: LexerRule<RegExp> = rules[i]
        if ('include' in rule) {
          const includes = this.getContext(rule.include, ContextOperation.INCLUDE)
          if (includes instanceof Array) {
            rules.splice(i, 1, ...includes)
          } else {
            throw new Error('Including a inline context is illegal. (no-include-inline)')
          }
        }
      }
      const result = rules.slice()
      if (prefixRegex) result.unshift({ regex: prefixRegex, pop: true, test: true })
      if (postfixRegex) result.push({ regex: postfixRegex, pop: true, test: true })
      return result
    }
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

  getContent(rule: DocumentLexerRule, capture: RegExpExecArray) {
    let prefixRegex = rule.prefix_regex
    let postfixRegex = rule.strict ? /^(?=[\s\S])/ : null
    if (prefixRegex instanceof Function) {
      prefixRegex = new RegExp(`^(?:${this.macros.resolve(prefixRegex.call(this, capture))})`)
    }
    const context = this.getContext(rule.push, ContextOperation.PUSH, prefixRegex, postfixRegex)
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
      token = token.call(this, capture, content, this.config)
    } else if (token === undefined) {
      if (rule.push) {
        token = { content }
      } else if (!rule.pop) {
        token = capture[0]
      }
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
    const inlineContext = this.getContext(context, ContextOperation.INLINE)
    if (inlineContext instanceof Array) {
      throw new Error(`'${context}' is not a inline context. (not-inline-context)`)
    }
    const result = inlineContext.run(source).output
    this.stackTrace.pop()
    return result
  }

  parse(source: string, context: string = this.entrance): TokenLike[] {
    const initialContext = this.getContext(context, ContextOperation.INITIAL)
    source = source.replace(/\r\n/g, '\n')
    try {
      return this.run(source, true, initialContext).output
    } catch (error) {
      console.log(this.stackTrace)
      console.error(error)
    }
  }
}
