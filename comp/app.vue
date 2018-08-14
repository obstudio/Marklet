<template>
  <div>{{msg}}</div>
</template>

<script>
  Vue.component('heading', require('./heading.vue'))
  Vue.component('usages', require('./usages.vue'))
  module.exports = {
    data: () => ({
      msg: 'hahahaha'
    })
  }
</script>

<style>

</style>