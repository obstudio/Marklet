<template>
  <ul>
    <li v-for="(item, index) in node.content" :key="index">{{item}}</li>
  </ul>
</template>

<style scoped>

li {
  display: inline;
}

</style>
