import { LexerConfig } from '@marklet/parser'
import Monaco from 'monaco-editor'

export default function(config: LexerConfig = {}) {
  return {
    tokenizer: {
      root: [
        { include: 'topLevel' },
      ],
      topLevel: [
        {
          regex: /(#{1,4}) +([^\n]+?)( +#)?/,
          action: {
            token: 'heading'
          }
        }
      ],
    },
  } as Monaco.languages.IMonarchLanguage
}
