<script>

module.exports = {
  name: 'file-tree',
  props: ['tree'],
}

</script>

<template>
  <div>
    <div v-if="tree.length" class="title">{{ tree[0] }}</div>
    <template v-for="(item, index) in tree.slice(1)">
      <div :key="index" class="item" v-if="typeof item === 'string'">{{ item }}</div>
      <file-tree :key="index" v-else class="children" :tree="item">
    </template>
  </div>
</template>

<style lang="scss" scoped>

& {
  font-size: 16px;
  user-select: none;
}

> .title, .item {
  line-height: 1.5em;
}

> .item, > .children {
  margin-left: 16px;
}

</style>
