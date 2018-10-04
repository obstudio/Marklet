<script>

module.exports = {
  props: {
    tag: {
      default: 'div',
      type: String
    },
    content: {
      required: true,
      type: Array
    }
  }
}

</script>

<template>
  <component :is="tag">
    <component v-for="(comp, index) in content"
      :is="'mkl-' + comp.type" :class="comp.type" :node="comp" :key="index"/>
  </component>
</template>

<style lang="scss" scoped>

> *:first-child {
  margin-top: 0;
}

</style>
