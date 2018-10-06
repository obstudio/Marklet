import {
  Lexer,
  parseRule,
  StringLike,
  LexerResult,
  LexerConfig,
  LexerRegexRule,
} from './lexer'

type InlineLexerRule = LexerRegexRule<RegExp, InlineLexer, InlineCapture>
export type InlineContext = LexerRegexRule<StringLike, InlineLexer, InlineCapture>[]

class InlineCapture extends Array<string> implements RegExpExecArray {
  public index: number
  public input: string
  private lexer: InlineLexer

  constructor(lexer: InlineLexer, array: RegExpExecArray) {
    super(...array)
    this.lexer = lexer
    this.index = array.index
    this.input = array.input
  }

  get inner(): string {
    const match = this.reverse().find(item => !!item)
    return match ? this.lexer.run(match).output : ''
  }
}

export class InlineLexer extends Lexer<string> {
  private rules: InlineLexerRule[]

  constructor(context: InlineContext, config?: LexerConfig) {
    super(config)
    this.rules = context.map(rule => parseRule(rule) as InlineLexerRule)
  }

  initialize() {
    this.meta.output = ''
    this.meta.context = this.rules
  }

  getCapture(rule: InlineLexerRule, capture: RegExpExecArray) {
    return new InlineCapture(this, capture)
  }

  pushToken(rule: InlineLexerRule, capture: InlineCapture) {
    let token = rule.token
    if (typeof token === 'function') {
      token = token.call(this, capture, null, this.config)
    } else if (token === undefined) {
      token = capture[0]
    }
    this.meta.output += token
  }

  pushUnmatch() {
    this.meta.output += this.meta.unmatch
  }

  parse(source: string): LexerResult<string> {
    return this.run(source.replace(/\r\n/g, '\n'), true)
  }

  fork(prefix?: RegExp, postfix?: RegExp): InlineLexer {
    const fork = new InlineLexer([])
    fork.rules = this.rules.slice()
    if (prefix) fork.rules.unshift({ regex: prefix, pop: true, test: true })
    if (postfix) fork.rules.push({ regex: postfix, pop: true, test: true })
    return fork
  }
}
