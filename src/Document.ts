import { Lexer, LexerOptions } from './Lexer'

function escape(html) {
    return html
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;')
}

export class DocLexer extends Lexer {
    constructor(options: LexerOptions = {}) {
        super({
            main: [
                {
                    // blockquote
                    regex: /> +/,
                    push: 'text',
                    type: 'blockquote'
                },
                {
                    // paragraph
                    regex: /(?=.)/,
                    push: 'text',
                    type: 'paragraph'
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
                    token: (cap) => `<del>${cap.next}</del>`
                },
                {
                    // bold
                    regex: /\*\*(?=\S)([\s\S]*?\S)\*\*(?!\*)/,
                    token: (cap) => `<strong>${cap.next}</strong>`
                },
                {
                    regex: /./,
                    token: (cap) => cap[0]
                }
            ]
        }, {
            getters: {
                next(capture) {
                    const result = this.parse(capture.reverse().find(item => !!item) || '')
                    return result.content.map(token => token.text).join('')
                }
            },
            ...options
        })
    }
}
