interface LexerRegexRule {
    type?: string
    regex: string | RegExp
    token?: LexerRuleToken
    push?: string | LexerContext
    pop?: boolean
}

interface LexerIncludeRule {
    include: string
}

type LexerRule = LexerRegexRule | LexerIncludeRule
type LexerContext = LexerRule[]

type LexerRules = {
    [key: string]: LexerContext
}

interface LexerToken {
    type: string
    text?: string
    content?: LexerToken[]
    [key: string]: any
}

type LexerRuleToken = string | LexerToken | ((
    capture: RegExpExecArray,
    content: LexerToken[]
) => string | LexerToken)

export default class Lexer {
    /** Lexing options */
    options: object
    /** Lexing rules */
    rules: LexerRules
    
    constructor(rules: LexerRules, macros : {[key: string]: string}, options = {}) {
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
        token: LexerRuleToken,
        capture: RegExpExecArray,
        content: LexerToken[]
    ): LexerToken {
        let result
        if (typeof token === 'string') {
            result = token
        } else if (token instanceof Function) {
            result = token.call(this, capture, content)
        } else if (content.length > 0) {
            result = content.map(token => token.text).join('')
        } else {
            result = capture[0]
        }
        if (result instanceof Array) {
            result = { content: result }
        } else if (typeof result === 'string') {
            result = { text: result }
        }
        return result
    }

    parse(source: string, context: string | LexerContext = 'main'): {
        index: number,
        result: LexerToken[]
    } {
        let index = 0, unmatch = ''
        const result = []
        const rules = this.getContext(context)
        while (source) {
            /**
             * Matching status:
             * 0. No match was found
             * 1. Found match and continue
             * 2. Found match and pop
             */
            let status = 0
            for (const rule of rules) {
                const capture = new RegExp(rule.regex).exec(source)
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
                    let data = this.getToken(rule.token, capture, content)
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
            } else if (unmatch) {
                result.splice(-1, 0, { type: 'default', text: unmatch })
                unmatch = ''
            }
            if (status === 2) break
        }
        if (unmatch) result.push({ type: 'default', text: unmatch })
        return {
            index,
            result
        }
    }
}
