<template>
  <div>
    <textarea v-model="source"/>
    <nodes :content="nodes"/>
  </div>
</template>

<script>
module.exports = {
  data: () => ({
    source: '',
    nodes: [],
  }),
  watch: {
    source(value) {
      this.nodes = window.marklet.parse(value)
    }
  },
}
</script>

<style>

</style>