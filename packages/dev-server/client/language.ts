import { LexerConfig } from '@marklet/parser'
import Monaco from 'monaco-editor'

export default function(config: LexerConfig = {}) {
  const language: Monaco.languages.IMonarchLanguage = {
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
  }

  return language
}
