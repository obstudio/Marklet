const Mousetrap = require('mousetrap')

// TODO: improve this pattern maybe. 
// Cause: firing event inside textarea is blocked by mousetrap by default.
Mousetrap.prototype.stopCallback = () => false

function toKebab(camel) {
  return camel.replace(/[A-Z]/g, char => '-' + char.toLowerCase())
}

const commands = {}
for (const command of require('./command.json')) {
  const key = command.key ? command.key : toKebab(command.method)
  commands[key] = command
}

const menus = require('./menus.json')
const menuData = {}
const menuKeys = Object.keys(menus)
for (const key of menuKeys) {
  menuData[key] = {
    show: false,
    content: menus[key],
    embed: new Array(menus[key].length).fill(false)
  }
}

module.exports = {
  components: {
    MarkletMenu: require('./menu-manager.vue'),
  },

  data() {
    return {
      menuData,
      menubarMove: 0,
      menubarActive: false,
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
    for (let index = 0; index < menuKeys.length; index++) {
      this.menuReference[menuKeys[index]] = this.$refs.menus.$el.children[index]
    }
  },

  methods: {
    executeMethod(key, ...args) {
      const method = this[key]
      if (method instanceof Function) method(...args)
    },
    executeCommand(command) {
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
      if (typeof arg === 'string' && arg.startsWith('$')) {
        return arg.slice(1).split('.').reduce((prev, curr) => prev[curr], this)
      } else {
        return arg
      }
    },
    hideContextMenus() {
      this.menubarActive = false
      for (const key in this.menuData) {
        this.menuData[key].show = false
        for (let index = 0; index < this.menuData[key].embed.length; index++) {
          this.menuData[key].embed.splice(index, 1, false)
        }
      }
    },
    showContextMenu(key, event) {
      const style = this.menuReference[key].style
      this.hideContextMenus()
      this.locateMenuAtClient(event, style)
      this.menuData[key].show = true
    },
    locateMenuAtClient(event, style) {
      if (event.clientX + 200 > this.width) {
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
    hoverMenu(index, event) {
      if (this.menubarActive && !this.menuData.menubar.embed[index]) {
        this.showMenu(index, event)
      }
    },
    showButtonMenu(key, event) {
      const style = this.menuReference[key].style
      this.hideContextMenus()
      this.locateMenuAtButton(event, style)
      this.menuData[key].show = true
    },
    showMenu(index, event) {
      const style = this.menuReference.menubar.style
      const last = this.menuData.menubar.embed.indexOf(true)
      if (last === index) {
        this.menubarActive = false
        this.menuData.menubar.show = false
        this.menuData.menubar.embed.splice(index, 1, false)
        return
      } else if (last === -1) {
        this.menubarMove = 0
      } else {
        this.menubarMove = index - last
      }
      this.hideContextMenus()
      this.locateMenuAtButton(event, style)
      this.menubarActive = true
      this.menuData.menubar.show = true
      this.menuData.menubar.embed.splice(index, 1, true)
    },
    locateMenuAtButton(event, style) {
      const rect = event.currentTarget.getBoundingClientRect()
      if (rect.left + 200 > this.width) {
        style.left = rect.left + rect.width - 200 + 'px'
      } else {
        style.left = rect.left + 'px'
      }
      style.top = rect.top + rect.height + 'px'
    },
  },
}
