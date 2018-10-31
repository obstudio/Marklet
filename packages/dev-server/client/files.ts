import Monaco from 'monaco-editor'
import Marklet from './index'

let count = 0

export interface FileOptions {
  title?: string
  value?: string
  path?: string
  origin?: string
  id?: string
  changed?: boolean
}

class MarkletModel {
  public value: string
  public title: string
  public path: string
  public origin: string
  public changed: boolean
  public id: string

  private marklet: typeof Marklet
  public model: Monaco.editor.ITextModel
  public viewState: Monaco.editor.ICodeEditorViewState

  constructor(marklet: typeof Marklet, options: FileOptions = {}) {
    this.value = options.value
    this.path = options.path
    this.origin = options.origin
    this.changed = options.changed
    this.title = options.title || `Untitled ${++count}`
    this.id = options.id || Math.floor(Math.random() * 36 ** 6).toString(36).padStart(6, '0')
    Object.defineProperty(this, 'marklet', {
      configurable: false,
      value: marklet,
    })
    marklet.$on('monaco.loaded', (monaco: typeof Monaco) => {
      Object.defineProperty(this, 'model', {
        configurable: false,
        value: monaco.editor.createModel(this.value, 'marklet')
      })
      this.model.onDidChangeContent(() => this.checkChange())
    })
  }

  dispose() {
    this.model.dispose()
  }

  checkChange(data?: string) {
    if (data !== undefined) this.origin = data
    this.value = this.model.getValue(
      this.marklet.editOptions.line_ending === 'LF' ? 1 : 2
    )
    this.changed = this.origin !== this.value
  }

  isEmpty() {
    return this.path === null && this.origin === '' && this.model.getValue(1) === ''
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

export default class ContentManager {
  public data: MarkletModel[] = []
  private marklet: typeof Marklet

  constructor(marklet: typeof Marklet) {
    // FIXME: get data from local storage
    Object.defineProperty(this, 'marklet', {
      configurable: false,
      value: marklet,
    })
    this.add({
      path: '__untitled__',
      title: 'untitled',
    })

    addEventListener('beforeunload', () => {
      // FIXME: save to local storage
    })
  }

  add(options: FileOptions) {
    const instance = this.get(options.path)
    if (instance) {
      // FIXME: handle other properties updating
      instance.value = options.value
    } else {
      this.data.push(new MarkletModel(this.marklet, options))
    }
  }

  get(path: string) {
    return this.data.find(instance => path === instance.path)
  }

  toJSON() {
    return this.data
  }
}
