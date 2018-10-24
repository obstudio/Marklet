const Mousetrap = require('mousetrap')

// TODO: improve this pattern maybe. 
// Cause: firing event inside textarea is blocked by mousetrap by default.
Mousetrap.prototype.stopCallback = () => false

function toKebab(camel) {
  return camel.replace(/[A-Z]/g, char => '-' + char.toLowerCase())
}

const commands = {}
require('./command.json').forEach((command) => {
  const key = command.key ? command.key : toKebab(command.method)
  commands[key] = command
})

const menuData = {}
require('./menus.json').forEach(function walk(menu) {
  if (menu.ref) {
    menuData[menu.ref] = menu
    menuData[menu.ref].show = false
    menuData[menu.ref].current = null
  }
  if (menu.children) {
    menu.children.forEach(walk)
  }
})
const menuKeys = Object.keys(menuData)

module.exports = {
  components: {
    MarkletMenu: require('./manager.vue'),
  },

  data() {
    return {
      menuData,
      altKey: false,
    }
  },

  provide() {
    return {
      menuKeys,
      commands,
      $menu: this,
    }
  },

  mounted() {
    for (const key in commands) {
      const command = commands[key]
      if (!command.bind || command.bind.startsWith('!')) continue
      Mousetrap.bind(command.bind, () => {
        this.executeCommand(command)
        return false
      })
    }
    this.menuReference = {}
    menuKeys.forEach((key, index) => {
      this.menuReference[key] = this.$refs.menus.$el.children[index]
    })
  },

  methods: {
    executeMethod(key, ...args) {
      const method = this[key]
      if (method instanceof Function) method(...args)
    },
    executeCommand(command) {
      if (!command.method) return
      const method = this[command.method]
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
        return !arg.slice(2).split('.').reduce((prev, curr) => prev[curr], this)
      } else if (arg.startsWith('$')) {
        return arg.slice(1).split('.').reduce((prev, curr) => prev[curr], this)
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
  },
}
