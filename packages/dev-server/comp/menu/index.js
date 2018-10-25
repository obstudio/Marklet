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
  const commandData = {}
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

  Vue.prototype.$registerMenus = function(menu) {
    const element = document.createElement('div')
    
    $menuManager = new MenuManager({ propsData: { menu } })
    $menuManager.$context = this
    $menuManager.commands = commandData
    Vue.prototype.$menuManager = $menuManager

    function mountMenuManager() {
      $menuManager.$mount(this.$el.appendChild(element))

      this.$el.addEventListener('click', () => $menuManager.hideAllMenus())
      this.$el.addEventListener('contextmenu', () => $menuManager.hideAllMenus())
    }

    if (this._isMounted) {
      mountMenuManager()
    } else {
      this.$options.mounted.push(mountMenuManager)
    }
  }
}
