import { Lexer, StringMap } from './Lexer'

type SyntaxRule = SyntaxMetaRule & SyntaxIncludeRule & SyntaxRegexRule
interface SyntaxMetaRule { meta: string }
interface SyntaxIncludeRule { include: string }
interface SyntaxRegexRule {
  regex?: string
  flags?: string
  scope?: string
  push?: string | SyntaxRule[]
  pop?: boolean
  eol?: boolean
  context_begins?: boolean
  top_level?: boolean
  ignore_case?: boolean
}

export class SyntaxLexer extends Lexer {
  constructor(contexts: StringMap<SyntaxRule[]>, macros: StringMap<string> = {}) {
    super(contexts, { macros })
  }
}
