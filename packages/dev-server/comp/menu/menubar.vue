<script>

const util = require('./util')

module.exports = {
  props: {
    from: {
      type: String,
      default: 'menubar',
    }
  },

  data: () => ({
    focused: false,
  }),

  computed: {
    children() {
      return this.$menuManager.menu.find(item => item.ref === this.from).children
    },
    origin() {
      return this.$menuManager.refs[this.from]
    },
  },

  mounted() {
    addEventListener('keydown', this.handleKeyDown)
    addEventListener('keypress', this.handleKeyPress)
  },

  beforeDestroy() {
    removeEventListener('keydown', this.handleKeyDown)
    removeEventListener('keypress', this.handleKeyPress)
  },

  methods: {
    handleKeyDown(event) {
      if (event.keyCode === 18) {
        this.focused = !this.focused
      } else if (event.keyCode === 27 && this.focused) {
        this.focused = false
        this.$menuManager.underlineMnemonic = false
      } else return
      event.preventDefault()
      event.stopPropagation()
    },
    handleKeyPress(event) {
      if (!this.focused) return
      const key = event.key.toUpperCase()
      const index = this.children.findIndex(menu => menu.mnemonic === key)
      if (index >= 0) {
        this.toggleMenu(index)
        this.$menuManager.underlineMnemonic = true
        event.preventDefault()
        event.stopPropagation()
      }
    },
    hoverMenu(index) {
      const current = this.origin.current
      if (current !== null && current !== index) {
        this.toggleMenu(index)
      }
    },
    toggleMenu(index) {
      if (this.origin.current === index) {
        this.origin.current = null
        return
      }
      this.focused = false
      const style = this.origin.$refs.standalone.style
      const rect = this.$el.children[index].getBoundingClientRect()
      this.$menuManager.hideAllMenus()
      util.locateAtTopBottom(rect, style)
      this.origin.current = index
    },
  }
}

</script>

<template>
  <div :class="['ob-menubar', { focused }]">
    <template v-if="$menuManager.loaded">
      <div v-for="(menu, index) in children" :key="index" class="item"
        @click.stop="toggleMenu(index)" @mouseover.stop="hoverMenu(index)"
        :class="{ active: origin.current === index }" @contextmenu.stop>
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
