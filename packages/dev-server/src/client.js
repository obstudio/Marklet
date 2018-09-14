const eventBus = new Vue()
Vue.prototype.$eventBus = eventBus
class WatchClient {
  constructor({ url = `ws://${location.host}/`, retry = true, timeout = 5000 } = {}) {
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


window.marklet = {
  comp: {
    watch: require('../temp/watch.vue'),
    edit: require('../temp/edit.vue'),
  },
  start({ el, type }) {
    new Vue(this.comp[type]).$mount(el)
    document.title = 'Marklet - ' + type
  }
}
