<script>

module.exports = {
  inject: ['$menu'],
  props: ['list'],
}

</script>

<template>
  <transition-group name="marklet-menu-list">
    <div v-for="(item, index) in $menu.parseArgument(list.data)" :key="index"
      :class="['menu-item', { active: item.key === $menu.parseArgument(list.current) }]"
      @click="$menu.executeMethod(list.switch, item.key)">
      <span class="label">{{ item.name }}</span>
    </div>
  </transition-group>
</template>

<style lang="scss" scoped>

.label {
  &.active { font-weight: bold }
}

</style>
