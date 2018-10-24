<script>

module.exports = {
  props: {
    menu: {
      type: String,
      default: 'menubar',
    }
  },

  computed: {
    data() {
      return this.$menu.menuData[this.menu]
    },
    element() {
      return this.$menu.menuReference[this.menu]
    },
  },

  methods: {
    hoverMenu(index, event) {
      const current = this.data.current
      if (current !== null && current !== index) {
        this.showMenu(index, event)
      }
    },
    showMenu(index, event) {
      const style = this.element.style
      const last = this.data.current
      if (last === index) {
        this.data.show = false
        this.data.current = null
        return
      }
      this.$menu.hideContextMenus()
      this.$menu.locateAtTopBottom(event, style)
      this.data.show = true
      this.data.current = index
    },
  }
}

</script>

<template>
  <div class="ob-menubar">
    <div v-for="(menu, index) in data.children" :key="index" class="item"
      @click.stop="showMenu(index, $event)" @mouseover.stop="hoverMenu(index, $event)"
      :class="{ active: data.current === index }" @contextmenu.stop>
      {{ menu.caption }} (<span>{{ menu.mnemonic }}</span>)&nbsp;
    </div>
  </div>
</template>

<style lang="scss" scoped>

& {
  overflow: hidden;
  font-size: 14px;
  left: 0;
  width: 100%;
  float: left;
  z-index: 11;
  user-select: none;
  position: relative;

  .item {
    line-height: 24px;
    padding: 4px;
    transition:
      color 0.3s ease,
      background-color 0.3s ease;
    display: inline-block;
  }
}

</style>
