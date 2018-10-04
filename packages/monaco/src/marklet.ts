import * as Monaco from 'monaco-editor'

const MarkletLanguage: Monaco.languages.IMonarchLanguage = {
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

export default MarkletLanguage
