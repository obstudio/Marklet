<script>

const util = require('./util')
const menuView = require('./menu-view.vue')

module.exports = {
  components: { menuView },

  data: () => ({
    menu: [],
    loaded: false,
    underlineMnemonic: false,
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
    registerMenus(context, menu) {
      menu.forEach(item => item.context = context)
      this.menu.push(...menu)
    },
    locateAtTopBottom(style, ref, marginY = 0, offsetX = 0) {
      if (ref.offsetLeft + 200 > innerWidth) {
        style.left = null
        style.right = ref.offsetRight - offsetX + 'px'
      } else {
        style.left = ref.offsetLeft + offsetX + 'px'
        style.right = null
      }
      style.top = ref.offsetBottom + marginY + 'px'
    },
    locateAtLeftRight(style, ref, offsetY = 0, marginX = 0) {
      if (ref.offsetRight + 200 > innerWidth) {
        style.left = null
        style.right = ref.offsetLeft - marginX + 'px'
      } else {
        style.right = null
        style.left = ref.offsetLeft + marginX + ref.offsetWidth + 'px'
      }
      style.top = ref.offsetTop + offsetY + 'px'
    },
    locateAtMouseEvent(event, style) {
      if (event.clientX + 200 > innerWidth) {
        style.left = event.clientX - 200 + 'px'
      } else {
        style.left = event.clientX + 'px'
      }
      if (event.clientY > innerHeight / 2) {
        style.top = ''
        style.bottom = innerHeight - event.clientY + 'px'
      } else {
        style.top = event.clientY + 'px'
        style.bottom = ''
      }
    },
    executeMethod(context, key, ...args) {
      const method = context[key]
      if (method instanceof Function) method(...args)
    },
    executeCommand(command) {
      if (typeof command === 'string') {
        command = this.commands[command]
      }
      if (!command || !command.method || !command.context) return
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
      this.underlineMnemonic = false
      this.$refs.menus.forEach(menu => menu.traverse((menu) => {
        menu.current = null
      }))
    },
    showContextMenu(key, event) {
      const style = this.$refs[key][0].$el.style
      this.hideAllMenus()
      util.locateAtMouseEvent(event, style)
      this.menuData[key].active = true
    },
  }
}

</script>

<template>
  <div class="ob-menu-manager" :class="{ 'underline-mnemonic': underlineMnemonic }">
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

&.underline-mnemonic {
  .mnemonic {
    text-decoration: underline;
  }
}

</style>
