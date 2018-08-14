<template>
  <component :is="'h'+node.level" v-html="node.text" :class="{ centered: node.center }"/>
</template>

<script>
  module.exports = { props: ['node'] }
</script>

<style lang="scss" scoped>

  h1, h2, h3, h4 {
    margin-top: 24px;
    font-weight: bold;
    line-height: 1.25;

    .center {
      margin: auto;
    }
  }

  h1 {
    font-size: 2em;
    margin-top: 48px;
    padding-bottom: 0.3em;
  }

  h2 {
    font-size: 1.5em;
    margin-top: 32px;
    padding-bottom: 0.3em;
  }

  h1, h2 { margin-bottom: 12px }
  h3, h4 { margin-bottom: 16px }
  h3 { font-size: 1.25em }
  h4 { font-size: 1em }

</style>

