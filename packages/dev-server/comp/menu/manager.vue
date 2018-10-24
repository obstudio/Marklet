<script>

module.exports = {
  props: ['data'],
  inject: ['menuKeys'],
  components: {
    MarkletMenuView: require('./menu-view.vue'),
  },
}

</script>

<template>
  <div class="marklet-menu-manager">
    <transition name="marklet-menu" v-for="key in menuKeys" :key="key">
      <marklet-menu-view class="marklet-menu" v-show="data[key].show"
        :data="data[key].children" :current="data[key].current"/>
    </transition>
  </div>
</template>

<style lang="scss" scoped>

& {
  width: 0;
  height: 0;
  top: 0;
  left: 0;
}

.marklet-menu {
  z-index: 10;
  padding: 0;
  margin: 0;
  outline: 0;
  border: none;
  padding: 2px 0;
  position: absolute;
  transition: 0.3s ease;
}

.marklet-menu-enter-active,
.marklet-menu-leave-active {
  opacity: 1;
  transform: scaleY(1);
  transform-origin: center top;
  transition:
    transform 0.3s cubic-bezier(0.23, 1, 0.32, 1),
    opacity 0.3s cubic-bezier(0.23, 1, 0.32, 1);
}

.marklet-menu-enter,
.marklet-menu-leave-to {
  opacity: 0;
  transform: scaleY(0);
}

</style>
