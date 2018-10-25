const Mousetrap = require('mousetrap')
const manager = require('./manager.vue')
const menubar = require('./menubar.vue')

// TODO: improve this pattern maybe. 
// Cause: firing event inside textarea is blocked by mousetrap by default.
Mousetrap.prototype.stopCallback = () => false

function toKebab(camel) {
  return camel.replace(/[A-Z]/g, char => '-' + char.toLowerCase())
}

module.exports = function(Vue) {
  Vue.component('ob-menubar', menubar)

  let $menuManager = null
  const commandData = {}, menuData = {}
  const MenuManager = Vue.extend(manager)

  Vue.prototype.$registerCommands = function(commands) {
    commands.forEach((command) => {
      const key = command.key ? command.key : toKebab(command.method)
      commandData[key] = command
      if (!command.bind || command.bind.startsWith('!')) return
      Mousetrap.bind(command.bind, () => {
        if (!$menuManager) return
        $menuManager.executeCommand(command)
        return false
      })
    })
  }

  Vue.prototype.$registerMenus = function(menus, parentNode) {
    menus.forEach(function walk(menu) {
      if (menu.ref) {
        menuData[menu.ref] = menu
        menuData[menu.ref].show = false
        menuData[menu.ref].focused = false
        menuData[menu.ref].current = null
      }
      if (menu.children) {
        menu.children.forEach(walk)
      }
    })
    const element = document.createElement('div')
    
    $menuManager = new MenuManager({ propsData: { menuData } })
    $menuManager.$context = this
    $menuManager._commands = commandData
    Vue.prototype.$menuManager = $menuManager

    function mountMenu() {
      $menuManager.$mount((parentNode || this.$el).appendChild(element))

      this.$el.addEventListener('click', () => {
        $menuManager.hideContextMenus()
      })
  
      this.$el.addEventListener('contextmenu', () => {
        $menuManager.hideContextMenus()
      })
    }

    if (this._isMounted) {
      mountMenu()
    } else {
      this.$options.mounted.push(mountMenu)
    }
  }
}
