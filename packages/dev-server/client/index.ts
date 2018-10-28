import VueConstructor from 'vue'
import Monaco from 'monaco-editor'
import fileConstructor from './file'
import defineLanguage from './language'
import * as renderer from '@marklet/renderer'
import { LexerConfig } from '@marklet/parser'
import { SourceType, ServerType, EditorConfig } from '../server'

declare global {
  export const Vue: typeof VueConstructor
}

Vue.use(renderer)
Vue.use(require('@/menu'))
Vue.component('mkl-checkbox', require('@/checkbox.vue'))

const eventBus = new Vue()

eventBus.$on('monaco.loaded', (monaco: typeof Monaco) => {
  monaco.languages.register({
    id: 'marklet',
    extensions: ['mkl', 'md'],
  })
  monaco.languages.setMonarchTokensProvider('marklet', defineLanguage())
  eventBus.$emit('monaco.language.loaded', monaco)
  monaco.editor.defineTheme('dark', require('../themes/dark'))
  monaco.editor.defineTheme('simple', require('../themes/simple'))
  eventBus.$emit('monaco.theme.loaded', monaco)
  if (!Vue.prototype.$colorize) {
    Vue.prototype.$colorize = function(code: string, lang: string) {
      return monaco.editor.colorize(code, lang, {})
    }
  }
})

const client = new class MarkletClient {
  private url: string
  private retry: boolean
  private _timeout: number
  private _interval: number
  private ws: WebSocket
  private msgQueue: string[]
  private timerRef: number

  constructor({
    url = `ws://${location.host}/`,
    retry = true,
    timeout = 5000,
    interval = 1000,
  } = {}) {
    this.url = url
    this.retry = retry
    this._timeout = timeout
    this.msgQueue = []
    this.createWebSocket()
    this.interval = interval
  }

  get interval() {
    return this._interval
  }

  set interval(value: number) {
    this._interval = value
    window.clearInterval(this.timerRef)
    this.timerRef = window.setInterval(() => {
      while (this.msgQueue.length > 0 && this.ws.readyState === 1) {
        this.ws.send(this.msgQueue.shift())
      }
    }, this._interval)
  }

  createWebSocket() {
    this.ws = new WebSocket(this.url)
    this.ws.addEventListener('close', (event) => {
      if (event.code !== 1000 && this.retry) {
        eventBus.$emit('ws.reconnect')
        setTimeout(() => this.createWebSocket(), this._timeout)
      } else {
        eventBus.$emit('ws.close')
      }
    })
    this.ws.addEventListener('error', () => {
      eventBus.$emit('ws.error')
    })
    this.ws.addEventListener('message', (event) => {
      try {
        const data = JSON.parse(event.data)
        eventBus.$emit('server.message', data)
        eventBus.$emit('server.' + data.type, data)
      } catch (error) {
        eventBus.$emit('server.error', error)
      }
    })
    this.ws.addEventListener('open', () => {
      eventBus.$emit('ws.open')
    })
    eventBus.$on('client.message', (type: string, data: string | Object) => {
      this.msgQueue.push(JSON.stringify({ type, data }))
    })
  }

  dispose() {
    if (this.ws.readyState < 2) this.ws.close()
    clearInterval(this.timerRef)
  }
}()

addEventListener('beforeunload', () => client.dispose())

const typeMap = {
  edit: '编辑',
  watch: '监视',
}

const app = require('@/app.vue')

export default new class Marklet {
  app: VueConstructor
  serverType: ServerType
  sourceType: SourceType
  editOptions: EditorConfig
  parseOptions: LexerConfig
  events = eventBus
  client = client
  File = fileConstructor(this)
  
  create(el: string | HTMLElement) {
    document.title = 'Marklet - ' + typeMap[this.serverType]
    return this.app = new Vue(app).$mount(el)
  }

  $on(event: string | string[], callback: Function) {
    this.events.$on(event, callback)
  }

  $once(event: string, callback: Function) {
    this.events.$once(event, callback)
  }

  $emit(event: string, ...args: any[]) {
    this.events.$emit(event, ...args)
  }
}
