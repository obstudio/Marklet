<script>

module.exports = {
  props: ['keys', 'data'],
  components: {
    mklMenu: require('./menu-view.vue')
  },
}

</script>

<template>
  <div class="marklet-menu-manager">
    <transition name="marklet-menu" v-for="key in keys" :key="key">
      <mkl-menu v-show="data[key].show" class="marklet-menu"
        :data="data[key].content" :embed="data[key].embed"/>
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
