<template>
  <mkl-collapse :initial="node.initial">
    <h2 v-html="node.text" slot="header" :class="[ 'level-' + node.level ]"/>
    <mkl-nodes :content="node.content"/>
  </mkl-collapse>
</template>

<style lang="scss" scoped>

&.mkl-collapse > .header {
  font-size: 1em;
  padding: 0 0;
  
  h2 {
    margin: 0;
    line-height: 1.25;
    padding: 0.3em 0;

    &.level-1 { font-size: 1.6em }
    &.level-2 { font-size: 1.2em }
    &.level-3 { font-size: 1.1em }
    &.level-4 { font-size: 1em }
  }
}

</style>

