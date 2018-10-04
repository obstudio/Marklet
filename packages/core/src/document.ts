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

function randomId(): string {
  return Math.floor(Math.random() * 36 ** 6).toString(36).padStart(6, '0')
}

export class DocumentLexer extends Lexer<TokenLike[]> {
  private stackTrace: ContextLog[]
  private contexts: Record<string, LexerRule<RegExp>[] | InlineLexer> = {}
  private entrance: string
  private inlineEntrance: string
  private requireBound: boolean

  constructor(contexts: DocumentContexts, options: DocumentOptions = {}) {
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
      if (context instanceof Array) {
        this.contexts[key] = context.map((rule) => parseRule(rule, macros, (_rule) => {
          if (typeof _rule.push !== 'string') return
          const _context = contexts[_rule.push]
          if (_context && !(_context instanceof Array)) {
            const fork = _context.fork(_rule.prefix_regex, _rule.strict ? /^(?=[\s\S])/ : null)
            const forkName = _rule.push + '-fork-' + randomId()
            this.contexts[forkName] = fork
            _rule.push = forkName
          }
        }))
      } else {
        this.contexts[key] = context
      }
    }
  }

  getContext(
    context: string | InlineLexer | LexerRule<RegExp>[],
    reason: ContextReason,
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
    if (!result) throw new Error(`Context '${context}' was not found. (context-not-found)`)
    if (result instanceof Array) {
      for (let i = result.length - 1; i >= 0; i -= 1) {
        const rule: LexerRule<RegExp> = result[i]
        if ('include' in rule) {
          const includes = this.getContext(rule.include, ContextReason.INCLUDE)
          if (includes instanceof Array) {
            result.splice(i, 1, ...includes)
          } else {
            throw new Error('Including a inline context is illegal. (no-include-inline)')
          }
        }
      }
      return result.slice()
    } else {
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

  getContent(rule: DocumentLexerRule) {
    const context = this.getContext(rule.push, ContextReason.PUSH)
    if (context instanceof Array) {
      if (rule.prefix_regex) context.unshift({ regex: rule.prefix_regex, pop: true, test: true })
      if (rule.strict) context.push({ regex: /^(?=[\s\S])/, pop: true, test: true })
    }
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
      throw new Error(`'${context}' is not a inline context. (not-inline-context)`)
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
