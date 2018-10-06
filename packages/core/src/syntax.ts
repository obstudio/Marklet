import {
  Lexer,
  StringLike,
  TokenLike,
  parseRule,
  getString,
  LexerRule,
  LexerMacros,
  MacroMap,
} from './lexer'

export interface SyntaxOptions {
  name?: string
  alias?: string[]
  macros?: Record<string, StringLike>
  contexts?: Record<string, LexerRule[]>
}

export class SyntaxLexer extends Lexer<TokenLike[]> {
  public name: string
  public alias: string[]
  private macros: MacroMap
  private contexts: Record<string, LexerRule<RegExp>[]> = {}

  constructor(options: SyntaxOptions) {
    super()
    this.name = options.name || ''
    this.alias = options.alias || []
    this.macros = new MacroMap(options.macros || {})

    for (const key in options.contexts) {
      const context = options.contexts[key]
      this.contexts[key] = context.map(rule => parseRule(rule, this.macros))
    }
  }
}
