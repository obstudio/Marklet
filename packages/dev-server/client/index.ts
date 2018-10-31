import VueConstructor from 'vue'
import Monaco from 'monaco-editor'
import ContentManager from './files'
import defineLanguage from './language'
import * as renderer from '@marklet/renderer'
import { LexerConfig } from '@marklet/parser'
import { SourceType, ServerType, EditorConfig } from '../server'

declare global {
  export const Vue: typeof VueConstructor
}

Vue.use(renderer)

const typeMap = {
  edit: '编辑',
  watch: '监视',
}

const app = require('@/app.vue')

export default new class MarkletClient {
  public app: VueConstructor
  public serverType: ServerType
  public sourceType: SourceType
  public editOptions: EditorConfig
  public parseOptions: LexerConfig
  public files: ContentManager

  private url: string
  private retry: boolean
  private timeout: number
  private _interval: number
  private msgQueue: string[]
  private timerRef: number
  private socket: WebSocket
  private events: VueConstructor

  constructor({
    url = `ws://${location.host}/`,
    retry = true,
    timeout = 5000,
    interval = 1000,
  } = {}) {
    this.url = url
    this.retry = retry
    this.timeout = timeout
    this.msgQueue = []
    this.events = new Vue()
    this.files = new ContentManager(this)
    this.createWebSocket()
    this.interval = interval

    this.$on('monaco.loaded', (monaco: typeof Monaco) => {
      monaco.languages.register({
        id: 'marklet',
        extensions: ['mkl', 'md'],
      })
      monaco.languages.setMonarchTokensProvider('marklet', defineLanguage())
      this.$emit('monaco.language.loaded', monaco)
      monaco.editor.defineTheme('dark', require('../themes/dark'))
      monaco.editor.defineTheme('simple', require('../themes/simple'))
      if (!Vue.prototype.$colorize) {
        Vue.prototype.$colorize = function(code: string, lang: string) {
          return monaco.editor.colorize(code, lang, {})
        }
      }
      this.$emit('monaco.theme.loaded', monaco)
    })

    addEventListener('beforeunload', () => this.dispose())
  }
  
  public start(el: string | HTMLElement) {
    document.title = 'Marklet - ' + typeMap[this.serverType]
    return this.app = new Vue(app).$mount(el)
  }

  public $on(event: string | string[], callback: Function) {
    this.events.$on(event, callback)
  }

  public $once(event: string, callback: Function) {
    this.events.$once(event, callback)
  }

  public $emit(event: string, ...args: any[]) {
    this.events.$emit(event, ...args)
  }

  public get interval() {
    return this._interval
  }

  public set interval(value: number) {
    this._interval = value
    window.clearInterval(this.timerRef)
    this.timerRef = window.setInterval(() => {
      while (this.msgQueue.length > 0 && this.socket.readyState === 1) {
        this.socket.send(this.msgQueue.shift())
      }
    }, this._interval)
  }

  private createWebSocket() {
    this.socket = new WebSocket(this.url)
    this.socket.addEventListener('close', (event) => {
      if (event.code !== 1000 && this.retry) {
        this.$emit('ws.reconnect')
        setTimeout(() => this.createWebSocket(), this.timeout)
      } else {
        this.$emit('ws.close')
      }
    })
    this.socket.addEventListener('error', () => {
      this.$emit('ws.error')
    })
    this.socket.addEventListener('message', (event) => {
      try {
        const data = JSON.parse(event.data)
        this.$emit('server.message', data)
        this.$emit('server.' + data.type, data)
      } catch (error) {
        this.$emit('server.error', error)
      }
    })
    this.socket.addEventListener('open', () => {
      this.$emit('ws.open')
    })
    this.$on('client.message', (data: object) => {
      this.msgQueue.push(JSON.stringify(data))
    })
  }

  private dispose() {
    if (this.socket.readyState < 2) this.socket.close()
    clearInterval(this.timerRef)
  }
}
