import Monaco from 'monaco-editor'
import Marklet from './index'

declare global {
  export const monaco: typeof Monaco
  export const marklet: typeof Marklet
}

let count = 0

export interface FileOptions {
  title?: string
  value?: string
  path?: string
  origin?: string
  id?: string
  changed?: boolean
}

export default class MarkletFile {
  public value: string
  public title: string
  public path: string
  public origin: string
  public changed: boolean
  public id: string

  private model: Monaco.editor.ITextModel

  constructor(options: FileOptions = {}) {
    this.value = options.value
    this.path = options.path
    this.origin = options.origin
    this.changed = options.changed
    this.title = options.title || `Untitled ${++count}`
    this.id = options.id || Math.floor(Math.random() * 36 ** 6).toString(36).padStart(6, '0')
    Object.defineProperty(this, 'model', {
      configurable: false,
      value: monaco.editor.createModel(this.value, 'marklet')
    })
  }

  onModelChange(listener: (event: Monaco.editor.IModelContentChangedEvent) => void) {
    this.model.onDidChangeContent(listener)
  }

  dispose() {
    this.model.dispose()
  }

  checkChange(data: string) {
    if (data !== undefined) this.origin = data
    this.value = this.model.getValue(
      marklet.editOptions.line_ending === 'LF' ? 1 : 2
    )
    this.changed = this.origin !== this.value
  }

  isEmpty() {
    return this.path === null && this.origin === '' && this.model.getValue(1) === ''
  }

  save() {
    // FIXME
  }

  toJSON() {
    return {
      title: this.title,
      value: this.value,
      path: this.path,
      id: this.id,
    }
  }
}
