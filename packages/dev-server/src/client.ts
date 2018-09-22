import Vue from 'vue'
import { DocLexer, DocLexerConfig } from '@marklet/parser'
declare module 'vue/types/vue' {
  interface Vue {
    $eventBus: typeof eventBus
  }
}
const eventBus = new Vue()
Vue.prototype.$eventBus = eventBus

Vue.use(require('@marklet/renderer'))

class WatchClient {
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

    this.ws = this.createWebSocket()
    this.registerListeners()
  }

  createWebSocket() {
    return new WebSocket(this.url)
  }

  registerListeners() {
    this.ws.addEventListener('close', (e) => {
      if (e.code !== 1000 && this.retry) {
        eventBus.$emit('ws.reconnect')
        setTimeout(() => {
          this.ws = this.createWebSocket()
          this.registerListeners()
        }, this.timeout)
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
}

const client = new WatchClient()
addEventListener('beforeunload', () => client.close())

export const Marklet = {
  comp: {
    watch: require('@/watch.vue'),
    edit: require('@/edit.vue'),
  },
  parse(source: string, config: DocLexerConfig) {
    return new DocLexer(config).parse(source)
  },
  start({ el, type }: { el: string | Element, type: 'watch' | 'edit' }) {
    new Vue(this.comp[type]).$mount(el)
    document.title = 'Marklet - ' + type
  }
}
