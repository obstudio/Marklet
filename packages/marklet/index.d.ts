import { parse, DocumentLexer, LexerConfig } from '@marklet/parser'

export { parse, DocumentLexer as Lexer }
export let config: LexerConfig
export function render(element: string | HTMLElement, source: string): void
