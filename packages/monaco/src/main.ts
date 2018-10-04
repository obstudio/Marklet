import * as Monaco from 'monaco-editor'
import MarkletLanguage from './marklet'

let $defined = false

export default function defineLanguage({ languages }: typeof Monaco) {
  if ($defined) return
  
  languages.register({
    id: 'mkl',
    extensions: ['mkl', 'marklet'],
  })

  languages.setMonarchTokensProvider('mkl', MarkletLanguage)

  $defined = true
}
