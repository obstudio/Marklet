<script>

module.exports = {
  data: () => ({
    source: '',
    nodes: [],
  }),
  watch: {
    source(value) {
      this.nodes = window.Marklet.parse(value)
    }
  },
}

</script>

<template>
  <div>
    <textarea v-model="source"/>
    <mkl-nodes :content="nodes"/>
  </div>
</template>

<style>

</style>