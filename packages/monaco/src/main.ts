import * as Monaco from 'monaco-editor'
import MarkletLanguage from './marklet'

declare global {
  interface Window {
    monaco: typeof Monaco
  }
}

let $defined = false

export default function defineLanguage() {
  if ($defined) return
  window.monaco.languages.register({
    id: 'mkl',
    extensions: ['mkl', 'marklet'],
  })

  window.monaco.languages.setMonarchTokensProvider('mkl', MarkletLanguage)

  $defined = true
}
