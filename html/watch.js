const ws = new WebSocket(`ws://${location.host}/`)
ws.addEventListener('open', () => {
  console.log('Ready to receive message.')
})
ws.addEventListener('error', () => {
  console.error('Error!')
})

marklet.vm.$on('mounted', () => {
  ws.addEventListener('message', (message) => {
    try {
      const { type, data } = JSON.parse(message.data)
      if (type === 'document') {
        marklet.vm.nodes = window.marklet.parse(data)
      } else if (type === 'error') {
        console.error(data)
      }
    } catch (error) {
      console.warn('Malformed server message.')          
    }
  })
})

marklet.vm.$on('before-destory', () => {
  if (ws.readyState < 2) ws.close()
})

marklet.vm.$mount('#app')
