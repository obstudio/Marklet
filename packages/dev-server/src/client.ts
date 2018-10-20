import VueConstructor from 'vue'
import Monaco from 'monaco-editor'
import * as renderer from '@marklet/renderer'
import { DocumentLexer, LexerConfig } from '@marklet/parser'

declare global {
  export const Vue: typeof VueConstructor
}

Vue.use(renderer)
Vue.component('mkl-checkbox', require('@/checkbox.vue'))

const eventBus = new Vue()
Vue.prototype.$eventBus = eventBus

eventBus.$on('monaco.loaded', (monaco: typeof Monaco) => {
  renderer.themes.forEach(({ key }) => {
    monaco.editor.defineTheme(key, require('../themes/' + key))
  })
})

const client = new class WatchClient {
  private url: string
  private retry: boolean
  private timeout: number
  private ws: WebSocket

  constructor({
    url = `ws://${location.host}/`,
    retry = true,
    timeout = 5000
  } = {}) {
    this.url = url
    this.retry = retry
    this.timeout = timeout
    this.createWebSocket()
  }

  createWebSocket() {
    this.ws = new WebSocket(this.url)
    this.ws.addEventListener('close', (e) => {
      if (e.code !== 1000 && this.retry) {
        eventBus.$emit('ws.reconnect')
        setTimeout(() => this.createWebSocket(), this.timeout)
      } else {
        eventBus.$emit('ws.close')
      }
    })
    this.ws.addEventListener('error', () => {
      eventBus.$emit('ws.error')
    })
    this.ws.addEventListener('message', e => {
      try {
        const { type, data } = JSON.parse(e.data)
        eventBus.$emit('server.message', type, data)
        eventBus.$emit('server.message.' + type, data)
      } catch (error) {
        eventBus.$emit('server.error')
      }
    })
    this.ws.addEventListener('open', () => {
      eventBus.$emit('ws.open')
    })
  }

  close() {
    if (this.ws.readyState < 2) this.ws.close()
  }
}()

addEventListener('beforeunload', () => client.close())

export const Marklet = {
  components: {
    watch: require('@/watch.vue'),
    edit: require('@/edit.vue'),
  },
  parse(source: string, config: LexerConfig) {
    return new DocumentLexer(config).parse(source)
  },
  start({ el, type }: { el: string | HTMLElement, type: 'watch' | 'edit' }) {
    document.title = 'Marklet - ' + type
    new Vue(this.components[type]).$mount(el)
  }
}
