import { Lexer, StringMap, LexerRules } from 'marklet-core'

type SyntaxRule = SyntaxMetaRule | SyntaxIncludeRule | SyntaxRegexRule
interface SyntaxToken { scope: string, text: string }
interface SyntaxMetaRule { meta: string }
interface SyntaxIncludeRule { include: string }
interface SyntaxRegexRule {
  regex?: string
  flags?: string
  scope?: string
  capture?: { [key: number]: string }
  push?: string | SyntaxRule[]
  pop?: boolean
  eol?: boolean
  context_begins?: boolean
  top_level?: boolean
  ignore_case?: boolean
  token?: (capture: RegExpExecArray, content: SyntaxToken[]) => SyntaxToken | SyntaxToken[]
}

export class SyntaxLexer extends Lexer {
  constructor(contexts: StringMap<SyntaxRule[]>, macros: StringMap<string> = {}) {
    function traverse(context: SyntaxRule[]): void {
      let meta = '', firstRule = context[0]
      if ('meta' in firstRule) {
        meta = firstRule.meta
        context.splice(0, 1).push({ regex: '[\s\S]', scope: meta })
      }
      context.forEach((rule) => {
        if ('meta' in rule) {
          throw new Error("'meta' can only be the first rule.")
        } else if (!('include' in rule)) {
          if (!rule.capture) rule.capture = {}
          if (rule.scope) {
            rule.capture[0] = rule.scope
            delete rule.scope
          }
          rule.token = (cap, cont) => {
            const result: SyntaxToken[] = []
            for (let i = 0; i < cap.length; i += 1) {
              result.push({ scope: rule.capture[i] || rule.capture[0] || meta, text: cap[i] })
            }
            return result.concat(cont)
          }
          delete rule.capture
          if (rule.push instanceof Array) traverse(rule.push)
        }
      })
    }
    for (const key in contexts) traverse(contexts[key])
    super(<LexerRules> contexts, { macros })
  }
}
