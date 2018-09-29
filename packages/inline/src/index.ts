import {
  StringLike,
  LexerConfig,
  LexerRegexRule,
  InlineLexerInstance,
  InlineLexerResult,
  MatchStatus,
  parseRule,
} from '@marklet/core'

class InlineCapture extends Array<string> implements RegExpExecArray {
  index: number
  input: string
  lexer: InlineLexer

  constructor(lexer: InlineLexer, array: RegExpExecArray) {
    super(...array)
    this.lexer = lexer
    this.index = array.index
    this.input = array.input
  }

  get inner(): string {
    const match = this.reverse().find(item => !!item)
    return match ? this.lexer.parse(match).output : ''
  }
}

type InlineLexerRule<S extends StringLike = RegExp> = LexerRegexRule<S, InlineLexer, InlineCapture>

export type InlineLexerRules = InlineLexerRule<StringLike>[]

export class InlineLexer implements InlineLexerInstance {
  config: LexerConfig
  private rules: InlineLexerRule[]

  constructor(rules: InlineLexerRules, config: LexerConfig = {}) {
    this.rules = rules.map(rule => parseRule(rule) as InlineLexerRule)
    this.config = config || {}
  }

  private _parse(source: string): InlineLexerResult {
    let index = 0, unmatch = '', output = ''
    while (source) {
      let status: MatchStatus = MatchStatus.NO_MATCH
      for (const rule of this.rules) {
        if (rule.context_begins && index) continue

        // test
        let test = rule.test
        if (typeof test === 'string') {
          if (test.charAt(0) === '!') {
            test = !this.config[test.slice(1)]
          } else {
            test = !!this.config[test]
          }
        } else if (typeof test === 'function') {
          test = test.call(this, this.config)
        }
        if (!test) continue

        // regex
        const match = rule.regex.exec(source)
        if (!match) continue
        if (!match[0].length && !rule.pop) {
          throw new Error(`Endless loop at '${
            source.slice(0, 10)
          } ${
            source.length > 10 ? '...' : ''
          }'.`)
        }
        const capture = new InlineCapture(this, match)
        source = source.slice(capture[0].length)
        index += capture[0].length

        // pop
        status = rule.pop ? MatchStatus.POP : MatchStatus.CONTINUE

        // resolve unmatch
        if (unmatch) {
          output += unmatch
          unmatch = ''
        }

        // token
        let token = rule.token
        if (typeof token === 'function') {
          token = token.call(this, capture)
        } else if (token === undefined) {
          token = capture[0]
        }
        output += token

        break
      }

      if (status === MatchStatus.POP) break
      if (status === MatchStatus.NO_MATCH) {
        unmatch += source.charAt(0)
        source = source.slice(1)
        index += 1
      }
    }

    if (unmatch) output += unmatch
    return { index, output }
  }

  parse(source: string): InlineLexerResult {
    return this._parse(source.replace(/\r\n/g, '\n'))
  }
}