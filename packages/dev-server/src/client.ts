import VueConstructor from 'vue'
import Monaco from 'monaco-editor'
import * as renderer from '@marklet/renderer'
import { LexerConfig } from '@marklet/parser'
import { SourceType, ServerType } from './server'

declare global {
  export const Vue: typeof VueConstructor
}

Vue.use(renderer)
Vue.component('mkl-checkbox', require('@/checkbox.vue'))

const eventBus = new Vue()
Vue.prototype.$eventBus = eventBus

eventBus.$on('monaco.loaded', (monaco: typeof Monaco) => {
  monaco.editor.defineTheme('dark', require('../themes/dark'))
  monaco.editor.defineTheme('simple', require('../themes/simple'))
  eventBus.$emit('monaco.theme.loaded', monaco)
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
        const { type, data } = JSON.parse(event.data)
        eventBus.$emit('server.' + type, data)
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

const App = Vue.extend(require('@/app.vue'))

export default new class Marklet {
  vm: VueConstructor
  type: ServerType
  config: LexerConfig
  sourceType: SourceType

  create(el: string | HTMLElement) {
    document.title = 'Marklet - ' + typeMap[this.type]
    return this.vm = new App().$mount(el)
  }
}
