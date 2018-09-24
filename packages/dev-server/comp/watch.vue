<script>

module.exports = {
  data: () => ({
    nodes: []
  }),
  created() {
    this.$eventBus.$on('server.message.document', (data) => {
      this.nodes = window.Marklet.parse(data)
    })
  }
}

</script>

<template>
  <div>
    <ml-nodes :content="nodes"/>
  </div>
</template>

<style>

</style>