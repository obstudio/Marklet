<template>
  <component :is="tag">
    <component v-for="(comp, index) in content"
      :is="comp.type" :class="comp.type" :node="comp" :key="index"/>
  </component>
</template>

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

