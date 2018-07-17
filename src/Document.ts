import Lexer from './Lexer'
export default class DocLexer extends Lexer {
    static Rules = {
        main: [
            {
                type: 'blockquote',
                regex: '> +',
                push: 'paragraph'
            }
        ],
        paragraph: [
            {
                regex: /\n/,
                pop: true
            },
            {
                regex: /\d+/,
                token(capture) {
                    return capture[0]
                }
            }
        ]
    }

    constructor(options = {}) {
        super(DocLexer.Rules, {}, options)
    }
}
