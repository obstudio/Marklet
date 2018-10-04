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
    <template v-for="(comp, index) in content">
      <component
        :is="'mkl-' + comp.type" :class="comp.type" :node="comp" :key="index"/>
      <slot/>
    </template>
  </component>
</template>

<style lang="scss" scoped>

> *:first-child {
  margin-top: 0;
}

</style>
