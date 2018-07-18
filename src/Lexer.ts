// generic types
export interface StringMap<V> {
    [key: string]: V
}
export type ResultMap<T extends StringMap<(...arg: any[]) => any>> = {
    [key in keyof T]: ReturnType<T[key]>
}

// Lexer types

type Capture = RegExpExecArray & GetterResults
type GetterFunction = (capture: Capture) => any // FIXME: narrow it?
type GetterFunctionMap = StringMap<GetterFunction>
type GetterResults = ResultMap<GetterFunctionMap>
export interface LexerOptions {
    getters?: GetterFunctionMap
}

export interface LexerRegexRule {
    type?: string
    regex: string | RegExp
    token?: LexerRuleToken
    push?: string | LexerContext
    pop?: boolean
}
export interface LexerIncludeRule {
    include: string
}
export type LexerRule = LexerRegexRule | LexerIncludeRule
export type LexerContext = LexerRule[]
export type LexerRules = StringMap<LexerContext>

export interface LexerToken {
    type?: string // FIXME: is it optional?
    text?: string
    content?: LexerToken[]
    [key: string]: any
}

export type LexerRuleToken = string | LexerToken | ((
    capture: Capture,
    content: LexerToken[]
) => string | LexerToken)

export default class Lexer {
    /** Lexing options */
    options: LexerOptions
    /** Lexing rules */
    rules: LexerRules
    context: string | LexerContext
    
    constructor(rules: LexerRules, macros : StringMap<string>, options:LexerOptions = {}) {
        function resolve(rule: LexerRule) {
            if ('regex' in rule) {
                let src = rule.regex instanceof RegExp ? rule.regex.source : rule.regex
                for (const key in macros) {
                    src = src.replace(new RegExp(`{{${key}}}`, 'g'), `(?:${macros[key]})`)
                }
                rule.regex = new RegExp(`^` + src)
                if (rule.push instanceof Array) rule.push.forEach(resolve)
            }
            return rule
        }
        this.rules = {}
        for (const key in rules) {
            this.rules[key] = rules[key].map(resolve)
        }
        this.options = options
        this.context = 'main'
    }

    private getContext(context: string | LexerContext): LexerRegexRule[] {
        const result = typeof context === 'string'
            ? this.rules[context]
            : context
        for (let i = result.length - 1; i >= 0; i -= 1) {
            const rule = result[i]
            if ('include' in rule) {
                result.splice(i, 1, ...this.getContext(rule.include))
            }
        }
        return <LexerRegexRule[]>result
    }

    private getToken(
        rule: LexerRegexRule,
        capture: RegExpExecArray,
        content: LexerToken[]
    ): LexerToken {
        let result: string | LexerToken[]
        if (typeof rule.token === 'string') {
            result = rule.token
        } else if (typeof rule.token === "function") {
            const getters = this.options.getters || {}
            for (const key in getters) {
                Object.defineProperty(capture, key, {
                    get: () => getters[key].call(this, capture)
                })
            }
            result = rule.token.call(this, capture, content)
        }
        if (result instanceof Array) {
            return { content: result }
        } else if (typeof result === 'string') { // FIXME: is it redundant?
            return { text: result }
        }
    }

    parse(source: string, context: string | LexerContext = this.context): {
        index: number,
        result: LexerToken[]
    } {
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
                const capture = new RegExp(rule.regex).exec(source) // FIXME: shall be cached
                if (capture) {
                    source = source.slice(capture[0].length)
                    status = rule.pop ? 2 : 1
                    index += capture[0].length
                    let content = []
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
                    let data = this.getToken(rule, capture, content)
                    if (data) {
                        data.type = data.type || rule.type
                        result.push(data)
                    }
                    break
                }
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
        return {
            index,
            result
        }
    }
}
