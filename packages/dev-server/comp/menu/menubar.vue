<script>

module.exports = {
  props: {
    menu: {
      type: String,
      default: 'menubar',
    }
  },

  data: () => ({
    focused: false,
  }),

  computed: {
    data() {
      return this.$menuManager.menuData[this.menu]
    },
    element() {
      return this.$menuManager.$refs[this.menu][0].$el
    },
  },

  mounted() {
    addEventListener('keydown', (event) => {
      if (event.keyCode !== 18) return
      this.focused = !this.focused
      this.$el.focus()
      event.preventDefault()
    })

    addEventListener('keypress', (event) => {
      if (!this.focused) return
      const key = event.key.toUpperCase()
      const index = this.data.children.findIndex(menu => menu.mnemonic === key)
      if (index >= 0) {
        this.toggleMenu(index)
      }
    })
  },

  methods: {
    hoverMenu(index) {
      const current = this.data.current
      if (current !== null && current !== index) {
        this.toggleMenu(index)
      }
    },
    toggleMenu(index) {
      const last = this.data.current
      if (last === index) {
        this.data.show = false
        this.data.current = null
        return
      }
      this.focused = false
      const style = this.element.style
      const rect = this.$el.children[index].getBoundingClientRect()
      this.$menuManager.hideContextMenus()
      this.$menuManager.locateAtTopBottom(rect, style)
      this.data.show = true
      this.data.focused = true
      this.data.current = index
    },
  }
}

</script>

<template>
  <div :class="['ob-menubar', { focused }]">
    <template v-if="$menuManager.loaded">
      <div v-for="(menu, index) in data.children" :key="index" class="item"
        @click.stop="toggleMenu(index)" @mouseover.stop="hoverMenu(index)"
        :class="{ active: data.current === index }" @contextmenu.stop>
        {{ menu.caption }} (<span class="mnemonic">{{ menu.mnemonic }}</span>)&nbsp;
      </div>
    </template>
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

&.focused {
  .mnemonic {
    text-decoration: underline;
  }
}

</style>
