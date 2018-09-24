import { parse, Lexer, LexerConfig } from '@marklet/parser'

export { parse, Lexer }
export let config: LexerConfig
export function render(element: string | HTMLElement, source: string): void
