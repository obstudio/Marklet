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
    this.$eventBus.$on('server.message.document', (data) => {
      this.nodes = window.Marklet.parse(data)
    })
  }
}
</script>

<style>

</style>