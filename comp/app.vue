<template>
  <div>
    <component v-for="(comp, index) in nodes" :is="comp.type" :node="comp" :key="index"/>
  </div>
</template>

<script>
  module.exports = {
    data: () => ({
      nodes: []
    }),
    mounted() {
      this.$emit('mounted')
    },
    beforeDestroy() {
      this.$emit('before-destroy')
    }
  }
</script>

<style>

</style>