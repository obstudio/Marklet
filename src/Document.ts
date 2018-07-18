import Lexer, {LexerOptions, LexerRules, StringMap} from './Lexer'

function escape(html) {
    return html
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;')
}

export default class DocLexer extends Lexer {
    static Rules: LexerRules = {
        main: [
            {
                // blockquote
                regex: /> +/,
                push: 'text',
                token: (_, cont) => `<blockquote>${cont.map(tok => tok.text).join('')}</blockquote>`
            },
            {
                // paragraph
                regex: /(?=.)/,
                push: 'text',
                token: (_, cont) => `<p>${cont.map(tok => tok.text).join('')}</p>`
            }
        ],
        text: [
            {
                // escape
                regex: /\\([\s\S])/,
                token: (cap) => cap[1]
            },
            {
                // new paragraph
                regex: /\n[ \t]*\n/,
                pop: true
            },
            {
                // new line
                regex: /\n/,
                token: '<br/>'
            },
            {
                // code
                regex: /(`+)\s*([\s\S]*?[^`]?)\s*\1(?!`)/,
                token: (cap) => `<code>${escape(cap[2])}</code>`
            },
            {
                // strikeout
                regex: /-(?=\S)([\s\S]*?\S)-/,
                token: (cap, cont) => `<del>${cap.next}</del>`
            },
            {
                // bold
                regex: /\*\*(?=\S)([\s\S]*?\S)\*\*(?!\*)/,
                token: (cap) => `<strong>${cap.next}</strong>`
            },
        ]
    }
    static Macros: StringMap<string> = {}
    static Options: LexerOptions = {
        getters: {
            next(capture) {
                const result = this.parse(capture.reverse().find(item => !!item)) // FIXME: buggy maybe should ba changed to null check considering empty string
                return result.content.map(token => token.text).join('')
            }
        }
    }

    constructor(options: LexerOptions = {}) {
        super(DocLexer.Rules, DocLexer.Macros, DocLexer.Options)
    }
}
