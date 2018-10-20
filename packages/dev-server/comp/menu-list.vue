<script>

module.exports = {
  inject: ['execute'],
  props: ['list'],
}

</script>

<template>
  <transition-group name="marklet-menu-list">
    <div v-for="(item, index) in list.data" class="menu-item"
      @click="execute(list.switch, item.key)" :key="index">
      <span class="label" :class="{ active: item.key === list.current }">
        {{ item.name }}
      </span>
    </div>
  </transition-group>
</template>

<style lang="scss" scoped>

.label {
  padding: 0.8em 1em;
  line-height: 1.1em;
  background: none;
  display: inline-block;
  margin: 0;

  &.active { font-weight: bold }
}

</style>
