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

  let $menu = null
  const commandData = {}, menuData = {}
  const MenuManager = Vue.extend(manager)

  Vue.prototype.$mousetrap = Mousetrap

  Vue.prototype.registerCommands = function(commands) {
    commands.forEach((command) => {
      const key = command.key ? command.key : toKebab(command.method)
      commandData[key] = command
      if (!command.bind || command.bind.startsWith('!')) return
      Mousetrap.bind(command.bind, () => {
        if (!$menu) return
        $menu.executeCommand(command)
        return false
      })
    })
  }

  Vue.prototype.registerMenus = function(menus, parentNode) {
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
    const menuKeys = Object.keys(menuData)
    const element = document.createElement('div')
    
    $menu = new MenuManager({
      propsData: { menuData, menuKeys },
      provide() {
        return {
          commands: commandData,
          $menu: this,
        }
      },
    })

    $menu.$context = this
    Vue.prototype.$menu = $menu

    function mountMenu() {
      $menu.$mount((parentNode || this.$el).appendChild(element))

      this.$el.addEventListener('click', () => {
        $menu.hideContextMenus()
      })
  
      this.$el.addEventListener('contextmenu', () => {
        $menu.hideContextMenus()
      })
    }

    if (this._isMounted) {
      mountMenu()
    } else {
      this.$options.mounted.push(mountMenu)
    }
  }
}
