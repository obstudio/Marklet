<script>

const util = require('./util')
const menuView = require('./menu-view.vue')

module.exports = {
  components: { menuView },

  data: () => ({
    menu: [],
    loaded: false,
  }),

  computed: {
    refs() {
      const result = {}
      this.menu.forEach((item, index) => {
        if (item.ref) {
          result[item.ref] = this.$refs.menus[index]
        }
      })
      return result
    },
  },

  mounted() {
    this.loaded = true
  },

  methods: {
    register(context, menu) {
      menu.forEach(item => item.context = context)
      this.menu.push(...menu)
    },
    executeMethod(context, key, ...args) {
      const method = context[key]
      if (method instanceof Function) method(...args)
    },
    executeCommand(command) {
      if (!command.method) return
      const method = command.context[command.method]
      if (!(method instanceof Function)) {
        console.error(`No method ${command.method} was found!`)
        return
      }
      let args = command.arguments
      if (args === undefined) args = []
      if (!(args instanceof Array)) args = [args]
      method(...args.map(arg => this.parseArgument(arg, command.context)))
    },
    parseArgument(arg, ctx) {
      if (typeof arg !== 'string') return arg
      if (arg.startsWith('!$')) {
        return !arg.slice(2).split('.').reduce((prev, curr) => prev[curr], ctx)
      } else if (arg.startsWith('$')) {
        return arg.slice(1).split('.').reduce((prev, curr) => prev[curr], ctx)
      } else {
        return arg
      }
    },
    hideAllMenus() {
      this.$refs.menus.forEach(menu => menu.traverse((menu) => {
        menu.active = false
        menu.current = null
      }))
    },
    showContextMenu(key, event) {
      const style = this.$refs[key][0].$el.style
      this.hideAllMenus()
      util.locateAtMouseEvent(event, style)
      this.menuData[key].active = true
    },
    showButtonMenu(key, event) {
      const style = this.$refs[key][0].$el.style
      const rect = event.currentTarget.getBoundingClientRect()
      this.hideAllMenus()
      util.locateAtTopBottom(rect, style)
      this.menuData[key].active = true
    },
  }
}

</script>

<template>
  <div class="marklet-menu">
    <menu-view v-for="(item, index) in menu" :key="index"
      :menu="item.children" :context="item.context" ref="menus"/>
  </div>
</template>

<style lang="scss" scoped>

& {
  top: 0;
  left: 0;
  width: 0;
  height: 0;
}

</style>
