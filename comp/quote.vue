<template>
  <blockquote :class="node.mode">
    <component v-for="(comp, index) in node.content" :is="comp.type" :node="comp" :key="index"/>
  </blockquote>
</template>

<style lang="scss" scoped>

  & {
    margin: 0 0 16px;
    padding: 4px 1em;
    border-left: 0.25em solid;

    > :first-child { margin-top: 0 }
    > :last-child { margin-bottom: 0 }
    code { background-color: inherit !important }
  }

</style>

