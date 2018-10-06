<template>
  <ul class="mkl-inlinelist">
    <li v-for="(item, index) in node.content" :key="index" v-html="item"/>
  </ul>
</template>

<style lang="scss" scoped>

& {
  padding: 0;
  text-align: center;

  li {
    padding: 8px;
    display: inline;
  }
}

</style>
