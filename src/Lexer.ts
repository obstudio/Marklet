type StringMap<V> = { [key: string]: V }
type ResultMap<T extends StringMap<(...arg: any[]) => any>> = {
    [key in keyof T]: ReturnType<T[key]>
}

type StringLike = string | RegExp
export type LexerMacros = StringMap<StringLike>

type Capture = RegExpExecArray & GetterResults
type GetterFunction = (capture: Capture) => TokenLike
type GetterFunctionMap = StringMap<GetterFunction>
type GetterResults = ResultMap<GetterFunctionMap>
export interface LexerOptions {
    getters?: GetterFunctionMap
    macros?: StringMap<StringLike>
    [key: string]: any
}

interface LexerToken {
    type?: string
    text?: string
    content?: LexerToken[]
    [key: string]: any
}

type TokenLike = string | LexerToken
interface LexerIncludeRule { include: string }
interface LexerRegexRule<S extends StringLike> {
    regex: S
    type?: string
    token?: TokenLike | ((capture: Capture, content: LexerToken[]) => TokenLike)
    push?: string | LexerRule<S>[]
    pop?: boolean
}

type LexerContext = string | NativeLexerRule[]
type LexerRule<S extends StringLike> = LexerRegexRule<S> | LexerIncludeRule
type LooseLexerRule = LexerRule<StringLike>
type NativeLexerRule = LexerRule<RegExp>
export type LexerRules = StringMap<LooseLexerRule[]>

interface LexerResult {
    index: number
    result: TokenLike[]
}

function getString(string: StringLike): string {
    return string instanceof RegExp ? string.source : string
}

export class Lexer {
    options: LexerOptions
    rules: StringMap<NativeLexerRule[]>
    context: LexerContext
    
    constructor(rules: LexerRules, options: LexerOptions = {}) {
        this.rules = {}
        this.options = options
        this.context = 'main'

        const _macros: StringMap<string> = {}
        options.getters || (options.getters = {})
        options.macros || (options.macros = {})
        for (const key in options.macros) {
            _macros[key] = getString(options.macros[key])
        }

        function resolve(rule: LooseLexerRule): NativeLexerRule {
            if ('regex' in rule) {
                let src = getString(rule.regex)
                for (const key in _macros) {
                    src = src.replace(new RegExp(`{{${key}}}`, 'g'), `(?:${_macros[key]})`)
                }
                rule.regex = new RegExp(`^` + src)
                if (rule.push instanceof Array) rule.push.forEach(resolve)
            }
            return <NativeLexerRule> rule
        }

        for (const key in rules) {
            this.rules[key] = rules[key].map(resolve)
        }
    }

    private getContext(context: LexerContext): LexerRegexRule<RegExp>[] {
        const result = typeof context === 'string' ? this.rules[context] : context
        for (let i = result.length - 1; i >= 0; i -= 1) {
            const rule: NativeLexerRule = result[i]
            if ('include' in rule) {
                result.splice(i, 1, ...this.getContext(rule.include))
            }
        }
        return <LexerRegexRule<RegExp>[]> result
    }

    private getToken(
        rule: LexerRegexRule<RegExp>,
        capture: RegExpExecArray,
        content: TokenLike[]
    ): TokenLike {
        if (typeof rule.token === "function") {
            for (const key in this.options.getters) {
                Object.defineProperty(capture, key, {
                    get: () => this.options.getters[key].call(this, capture)
                })
            }
            return rule.token.call(this, capture, content)
        } else {
            return rule.token
        }
    }

    parse(source: string, context: LexerContext = this.context): LexerResult {
        let index = 0, unmatch = ''
        const result = []
        const rules = this.getContext(context)
        const _context = this.context
        this.context = context
        source = source.replace(/\r\n/g, '\n')
        while (source) {
            /**
             * Matching status:
             * 0. No match was found
             * 1. Found match and continue
             * 2. Found match and pop
             */
            let status = 0
            for (const rule of rules) {
                const capture = rule.regex.exec(source)
                if (!capture) continue
                source = source.slice(capture[0].length)
                status = 1 + Number(rule.pop)
                index += capture[0].length
                let content: TokenLike[] = []
                if (rule.push) {
                    const subtoken = this.parse(source, rule.push)
                    source = source.slice(subtoken.index)
                    index += subtoken.index
                    content = subtoken.result
                }
                if (unmatch) {
                    result.push({ type: 'default', text: unmatch })
                    unmatch = ''
                }
                const token = this.getToken(rule, capture, content)
                if (token) {
                    if (typeof token === 'object') token.type = token.type || rule.type
                    result.push(token)
                }
                break
            }
            if (!status && source) {
                unmatch += source.charAt(0)
                source = source.slice(1)
                index += 1
            }
            if (status === 2) break
        }
        if (unmatch) result.push({ type: 'default', text: unmatch })
        this.context = _context
        return { index, result }
    }
}
