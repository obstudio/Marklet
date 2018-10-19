const Mousetrap = require('mousetrap')
const menu = require('./menu.vue')
const menubar = require('./menubar.vue')

// TODO: improve this pattern maybe. 
// Cause: firing event inside textarea is blocked by mousetrap by default.
Mousetrap.prototype.stopCallback = () => false

function toKebab(camel) {
  return camel.replace(/[A-Z]/g, char => '-' + char.toLowerCase())
}

module.exports = (Vue) => {
  const MenuVue = Vue.extend(menu)

  const $menu = {
    register() {
      MenuVue
      toKebab
    }
  }

  Vue.prototype.$menu = $menu
  Vue.component('mkl-menubar', menubar)
}
