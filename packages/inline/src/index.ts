type StringLike = string | RegExp

interface InlineCapture extends RegExpExecArray {
  inner: string
}

interface InlineLexerRule<S extends StringLike = StringLike> {
  /** the regular expression to execute */
  regex?: S
  /**
   * a string containing all the rule flags:
   * - `b`: match when the context begins
   * - `e`: match end of line
   * - `i`: ignore case
   * - `p`: pop from the current context
   */
  flags?: string
  /** default type of the token */
  type?: string
  /** whether the rule is to be executed */
  test?: string | boolean | ((this: InlineLexer, config: LexerConfig) => boolean)
  /** a result token */
  token?: string | ((this: InlineLexer, capture: InlineCapture) => string)
  /** pop from the current context */
  pop?: boolean
  /** match when the context begins */
  context_begins?: boolean
  /** whether to ignore case */
  ignore_case?: boolean
  /** match end of line */
  eol?: boolean
}

export type LexerConfig = Record<string, any>
export type InlineLexerRules = InlineLexerRule<StringLike>[]
export interface InlineResult {
  index: number
  output: string
}

export class InlineLexer {
  config: LexerConfig
  private Capture: any
  private rules: InlineLexerRule<RegExp>[]

  constructor(rules: InlineLexerRules, config: LexerConfig = {}) {
    const self = this
    this.config = config

    this.Capture = class extends Array<string> implements InlineCapture {
      index: number
      input: string
    
      constructor(array: RegExpExecArray) {
        super(...array)
        this.index = array.index
        this.input = array.input
      }

      get inner(): string {
        const match = this.reverse().find(item => !!item)
        return match ? self.parse(match).output : ''
      }
    }

    this.rules = rules.map((rule) => {
      if (rule.regex === undefined) {
        rule.regex = /(?=[\s\S])/
        if (!rule.type) rule.type = 'default'
      }
      if (rule.test === undefined) rule.test = true
      let src = rule.regex instanceof RegExp ? rule.regex.source : rule.regex
      let flags = ''
      rule.flags = rule.flags || ''
      if (rule.flags.replace(/[biep]/g, '')) {
        throw new Error(`'${rule.flags}' contains invalid rule flags.`)
      }
      if (rule.flags.includes('p')) rule.pop = true
      if (rule.flags.includes('b')) rule.context_begins = true
      if (rule.flags.includes('e') || rule.eol) src += ' *(?:\\n+|$)'
      if (rule.flags.includes('i') || rule.ignore_case) flags += 'i'
      rule.regex = new RegExp('^(?:' + src + ')', flags)
      return rule as InlineLexerRule<RegExp>
    })
  }

  private _parse(source: string): InlineResult {
    let index = 0, unmatch = '', output = ''
    while (source) {
      /**
       * Matching status:
       * 0. No match was found
       * 1. Found match and continue
       * 2. Found match and pop
       */
      let status = 0
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
        if (!match[0].length) {
          throw new Error(`Endless loop at '${
            source.slice(0, 10)
          } ${
            source.length > 10 ? '...' : ''
          }'.`)
        }
        const capture = new this.Capture(match)
        source = source.slice(capture[0].length)
        index += capture[0].length

        // pop
        const pop = rule.pop
        status = pop ? 2 : 1

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

      if (status === 2) break
      if (status === 0) {
        unmatch += source.charAt(0)
        source = source.slice(1)
        index += 1
      }
    }

    if (unmatch) output += unmatch
    return { index, output }
  }

  parse(source: string): InlineResult {
    return this._parse(source.replace(/\r\n/g, '\n'))
  }
}