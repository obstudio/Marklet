<script>

module.exports = {
  inject: ['$menu'],
  props: ['list'],
}

</script>

<template>
  <transition-group name="marklet-menu-list">
    <div v-for="(item, index) in list.data" :key="index"
      :class="['menu-item', { active: item.key === list.current }]"
      @click="$menu.executeMethod(list.switch, item.key)">
      <span class="label">{{ list.prefix }}{{ item.name }}{{ list.postfix }}</span>
    </div>
  </transition-group>
</template>

<style lang="scss" scoped>

.label {
  &.active { font-weight: bold }
}

</style>
