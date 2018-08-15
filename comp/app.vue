<template>
  <div>
    <component v-for="(comp, index) in structure" :is="comp.type" :node="comp" :key="index"/>
  </div>
</template>

<script>
  module.exports = {
    data: () => ({
      structure: {}
    }),
    created() {
      const ws = new WebSocket(`ws://${location.host}/`)
      ws.addEventListener('open', () => {
        console.log('Ready to receive message.')
      })
      ws.addEventListener('error', () => {
        console.error('Error!')
      })
      ws.addEventListener('message', (msg) => {
        try {
          const { type, data } = JSON.parse(msg.data)
          if (type === 'doc') {
            this.structure = data
          } else if (type === 'error') {
            console.error(data)
          }
        } catch (error) {
          console.warn('Malformed server message.')          
        }
      })
      this.ws = ws
    },
    beforeDestroy() {
      if (this.ws.readyState < 2) {
        this.ws.close()
      }
    }
  }
</script>

<style>

</style>