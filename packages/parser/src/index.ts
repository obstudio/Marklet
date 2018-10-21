import { LexerConfig, TokenLike, LexerToken } from '@marklet/core'
import MarkletInlineLexer from './inline'
import MarkletDocumentLexer from './document'

interface MarkletLexerConfig extends LexerConfig {
  /** enable header to align at center */
  header_align?: boolean
  /** allow section syntax */
  allow_section?: boolean
  /** default language in code block */
  default_language?: string
  /** assign start/end to tokens */
  require_bound?: boolean
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

export namespace Tokens {
  export type Text = string
  
  export interface Heading extends LexerToken {
    type: 'heading'
    level: number
    center: boolean
  }
  
  export interface Section extends LexerToken {
    type: 'section'
    level: number
    initial: 'open' | 'closed'
    content: LexerToken[]
  }
  
  export interface CodeBlock extends LexerToken {
    type: 'codeblock'
    lang: string
  }
  
  export interface Separator extends LexerToken {
    type: 'separator'
    thick: boolean
    style: 'normal' | 'dashed' | 'dotted'
  }
  
  export interface InlineList extends LexerToken {
    type: 'inlinelist'
    content: string[]
  }

  export interface ListItem extends LexerToken {
    type: 'list-item'
    order: string
    children?: ListItem[]
  }

  export interface List extends LexerToken {
    type: 'list'
    children?: ListItem[]
  }

  export interface Paragraph extends LexerToken {
    type: 'paragraph'
  }

  export interface Quote extends LexerToken {
    type: 'quote'
    style: string
    content: LexerToken[]
  }

  export interface Table extends LexerToken {
    type: 'table'
    columns: {
      align: 'left' | 'center' | 'right'
      bold: boolean
    }[]
    data: string[][]
  }

  export interface Usage extends LexerToken {
    type: 'usage'
    content: LexerToken[]
  }

  export interface Usages extends LexerToken {
    type: 'usages'
    content: Usage[]
  }
}
