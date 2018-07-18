export type LexerContext = (LexerRegexRule | LexerIncludeRule)[]

export interface LexerIncludeRule {
    include: string
}

export type LexerRuleToken = string | LexerToken | ((
    capture: RegExpExecArray,
    content: LexerToken[]
) => string | LexerToken)

export interface LexerRegexRule {
    type?: string
    regex: string | RegExp
    token: LexerRuleToken
    push?: string | LexerContext
    pop?: boolean
}

export interface LexerToken {
    type: string
    text?: string
    content?: LexerToken[]
    [key: string]: any
}

export class Lexer {
    /** Lexing options */
    options: object
    /** Lexing rules */
    rules: { [key: string]: LexerContext }
    /** Lexing context */
    context: string | LexerContext

    /** Marklet lexer constructor */
    constructor(rules: object, macros: object, options: object) 

    private getContext(context: string | LexerContext): LexerRegexRule[]

    private getToken(
        rule: LexerRegexRule,
        capture: RegExpExecArray,
        content: LexerToken[]
    ): LexerToken

    public parse(source: string, context: string | LexerContext): {
        index: number,
        result: LexerToken[]
    }
}

