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
    current: null,
    focused: false,
  }),

  computed: {
    children() {
      return this.$menuManager.menu.find(item => item.ref === this.from).children
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
      const index = this.children.findIndex(menu => menu.mnemonic === key)
      if (index >= 0) {
        this.toggleMenu(index)
      }
    })
  },

  methods: {
    hoverMenu(index) {
      const current = this.current
      if (current !== null && current !== index) {
        this.toggleMenu(index)
      }
    },
    toggleMenu(index) {
      if (this.current === index) {
        this.current = null
        return
      }
      this.focused = false
      const source = this.$menuManager.refs[this.from]
      const style = source.$el.style
      const rect = this.$el.children[index].getBoundingClientRect()
      this.$menuManager.hideAllMenus()
      util.locateAtTopBottom(rect, style)
      source.active = true
      source.current = index
      this.current = index
    },
  }
}

</script>

<template>
  <div :class="['ob-menubar', { focused }]">
    <template v-if="$menuManager.loaded">
      <div v-for="(menu, index) in children" :key="index" class="item"
        @click.stop="toggleMenu(index)" @mouseover.stop="hoverMenu(index)"
        :class="{ active: current === index }" @contextmenu.stop>
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
