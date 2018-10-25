<script>

const util = require('./util')
const menuView = require('./menu-view.vue')

module.exports = {
  components: { menuView },

  props: ['menu'],

  data: () => ({
    loaded: false,
  }),

  computed: {
    refs() {
      const result = {}
      this.menu.forEach((item, index) => {
        if (item.ref) {
          result[item.ref] = this.$refs.main.$refs[index][0]
        }
      })
      return result
    },
  },

  mounted() {
    this.loaded = true
  },

  methods: {
    executeMethod(key, ...args) {
      const method = this.$context[key]
      if (method instanceof Function) method(...args)
    },
    executeCommand(command) {
      if (!command.method) return
      const method = this.$context[command.method]
      if (!(method instanceof Function)) {
        console.error(`No method ${command.method} was found!`)
        return
      }
      let args = command.arguments
      if (args === undefined) args = []
      if (!(args instanceof Array)) args = [args]
      method(...args.map(arg => this.parseArgument(arg)))
    },
    parseArgument(arg) {
      if (typeof arg !== 'string') return arg
      if (arg.startsWith('!$')) {
        return !arg.slice(2).split('.').reduce((prev, curr) => prev[curr], this.$context)
      } else if (arg.startsWith('$')) {
        return arg.slice(1).split('.').reduce((prev, curr) => prev[curr], this.$context)
      } else {
        return arg
      }
    },
    hideAllMenus() {
      for (const key in this.menuData) {
        this.menuData[key].show = false
        this.menuData[key].current = null
      }
    },
    showContextMenu(key, event) {
      const style = this.$refs[key][0].$el.style
      this.hideAllMenus()
      util.locateAtMouseEvent(event, style)
      this.menuData[key].show = true
    },
    showButtonMenu(key, event) {
      const style = this.$refs[key][0].$el.style
      const rect = event.currentTarget.getBoundingClientRect()
      this.hideAllMenus()
      util.locateAtTopBottom(rect, style)
      this.menuData[key].show = true
    },
  }
}

</script>

<template>
  <menu-view ref="main" :menu="menu"/>
</template>

<style lang="scss" scoped>

& {
  top: 0;
  left: 0;
  width: 0;
  height: 0;
}

</style>
