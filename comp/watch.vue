<template>
  <div>
    <nodes :content="nodes"/>
  </div>
</template>

<script>
  module.exports = {
    data: () => ({
      nodes: []
    }),
    created() {
      this.ws = new WebSocket(`ws://${location.host}/`)
      this.ws.addEventListener('open', () => {
        console.log('Ready to receive message.')
      })
      this.ws.addEventListener('error', () => {
        console.error('Error!')
      })
      this.ws.addEventListener('message', (message) => {
        try {
          const { type, data } = JSON.parse(message.data)
          if (type === 'document') {
            this.nodes = window.marklet.parse(data)
          } else if (type === 'error') {
            console.error(data)
          }
        } catch (error) {
          console.warn('Malformed server message.')          
        }
      })
    },
    beforeDestroy() {
      if (this.ws.readyState < 2) this.ws.close()
    }
  }
</script>

<style>

</style>