import { LexerConfig, TokenLike } from '@marklet/core'
import MarkletInlineLexer from './inline'
import MarkletDocumentLexer from './document'

export { ListItem } from './document'

interface MarkletLexerConfig extends LexerConfig {
  /** enable header to align at center */
  header_align?: boolean
  /** allow section syntax */
  allow_section?: boolean
  /** default language in code block */
  default_language?: string
}

export interface ParseOptions {
  input: string
  config?: MarkletLexerConfig
}

export function parse(options: ParseOptions): TokenLike[] {
  let source
  if (options.input) {
    source = options.input
  } else {
    throw new Error("'input' option is required.")
  }
  return new MarkletDocumentLexer(options.config).parse(source)
}

export {
  MarkletLexerConfig as LexerConfig,
  MarkletInlineLexer as InlineLexer,
  MarkletDocumentLexer as DocumentLexer,
}
