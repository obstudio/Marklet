<template>
  <div>
    <textarea v-model="source"/>
    <component v-for="(comp, index) in nodes" :is="comp.type" :node="comp" :key="index"/>
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