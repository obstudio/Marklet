<script>

module.exports = {
  name: 'mkl-menu',
  inject: ['commands', '$menu'],
  props: ['data', 'embed'],
  components: {
    mklMenuList: require('./menu-list.vue'),
    mklMenuItem: require('./menu-item.vue'),
  },
}

</script>

<template>
  <div>
    <template v-for="(item, index) in data">
      <template v-if="(item instanceof Object)">
        <mkl-menu :key="index" v-show="embed[index]" :data="item.content"/>
      </template>
      <div :key="index" v-else-if="item === '@separator'" class="menu-item disabled" @click.stop>
        <div class="separator"/>
      </div>
      <mkl-menu-item :key="index" v-else-if="!item.startsWith('@')" :command="commands[item]"/>
      <mkl-menu-list :key="index" v-else :list="$menu.lists[item.slice(1)]"/>
    </template>
  </div>
</template>

<style lang="scss" scoped>

& {
  min-width: 200px;
  user-select: none;
}

.menu-item {
  padding: 0;
  display: flex;
  cursor: pointer;
  font-size: 12px;

  > .separator {
    margin: 0.3em 0.5em;
    padding: 1px 0 0 0;
    border-bottom: 1px solid;
    width: 100%;
  }

  > .caption {
    font-size: 12px;
    margin: 0.4em auto 0.2em;
  }

  > .label {
    flex: 1 1 auto;
    padding: 0.8em 1em;
    line-height: 1.1em;
    background: none;
    display: inline-block;
    margin: 0;
  }

  > .binding {
    display: inline-block;
    flex: 2 1 auto;
    padding: 0.8em 1em;
    line-height: 1.1em;
    text-align: right;
  }

  &.disabled { cursor: default }
}

</style>

