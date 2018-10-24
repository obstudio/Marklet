<script>

module.exports = {
  props: ['menuData', 'menuKeys'],

  components: {
    MarkletMenuView: require('./menu-view.vue'),
  },

  mounted() {
    this.menuReference = {}
    this.menuKeys.forEach((key, index) => {
      this.menuReference[key] = this.$el.children[index]
    })
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
    hideContextMenus() {
      for (const key in this.menuData) {
        this.menuData[key].show = false
        this.menuData[key].current = null
      }
    },
    showContextMenu(key, event) {
      const style = this.menuReference[key].style
      this.hideContextMenus()
      this.locateMenuAtClient(event, style)
      this.menuData[key].show = true
    },
    locateMenuAtClient(event, style) {
      if (event.clientX + 200 > innerWidth) {
        style.left = event.clientX - 200 - this.left + 'px'
      } else {
        style.left = event.clientX - this.left + 'px'
      }
      if (event.clientY - this.top > this.height / 2) {
        style.top = ''
        style.bottom = this.top + this.height - event.clientY + 'px'
      } else {
        style.top = event.clientY - this.top + 'px'
        style.bottom = ''
      }
    },
    showButtonMenu(key, event) {
      const style = this.menuReference[key].style
      this.hideContextMenus()
      this.locateAtTopBottom(event, style)
      this.menuData[key].show = true
    },
    locateAtTopBottom(event, style) {
      const rect = event.currentTarget.getBoundingClientRect()
      if (rect.left + 200 > innerWidth) {
        style.left = rect.left + rect.width - 200 + 'px'
      } else {
        style.left = rect.left + 'px'
      }
      style.top = rect.top + rect.height + 'px'
    },
    locateAtLeftRight(event, style) {
      const rect = event.currentTarget.getBoundingClientRect()
      if (rect.right + 200 > innerWidth) {
        style.left = null
        style.right = rect.left + 'px'
      } else {
        style.right = null
        style.left = rect.right + 'px'
      }
      style.top = rect.top + 'px'
    },
  }
}

</script>

<template>
  <div class="marklet-menu-manager">
    <transition name="marklet-menu" v-for="key in menuKeys" :key="key">
      <marklet-menu-view class="marklet-menu" v-show="menuData[key].show"
        :data="menuData[key].children" :current="menuData[key].current"/>
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
