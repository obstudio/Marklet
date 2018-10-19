<script>

module.exports = {
  props: {
    content: { default: [] },
  }
}

</script>

<template>
  <div class="marklet-menubar">
    <div v-for="(menu, index) in content" :key="index"
      @click.stop="$menu.show(index, $event)"
      @mouseover.stop="$menu.hover(index, $event)"
      @contextmenu.stop>
      {{ menu.name }} (<span>{{ menu.bind }}</span>)
    </div>
  </div>
</template>

<style lang="scss" scoped>

& {
  left: 0;
  width: 100%;
  height: 32px;
  float: left;
  overflow: hidden;
  position: relative;
  user-select: none;
  font-size: 14px;

  > div {
    line-height: 24px;
    padding: 4px;
    transition: 0.3s;
    display: inline-block;
  }
}

</style>
