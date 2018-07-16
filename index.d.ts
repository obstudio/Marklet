export type LexerContext = (LexerRule | { include: string })[]

export type LexerRuleToken = string | LexerToken | ((
    capture: RegExpExecArray,
    content: LexerToken[]
) => string | LexerToken)

export interface LexerRule {
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
    options: object
    rules: { [key: string]: LexerContext }

    /** Marklet lexer constructor */
    constructor(rules: object, macros: object, options: object) 

    private getContext(context: string | LexerContext): LexerRule[]

    private getToken(
        token: LexerRuleToken,
        capture: RegExpExecArray,
        content: LexerToken[]
    ): LexerToken

    public parse(source: string, context: string | LexerContext): {
        index: number,
        result: LexerToken[]
    }
}

