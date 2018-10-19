<script>

const Mousetrap = require('mousetrap')

// TODO: improve this pattern maybe. 
// Cause: firing event inside textarea is blocked by mousetrap by default.
Mousetrap.prototype.stopCallback = () => false

function toKebab(camel) {
  return camel.replace(/[A-Z]/g, char => '-' + char.toLowerCase())
}

const commandData = require('./command.json')
const menus = require('./menus.json')

const commands = {}
for (const command of commandData) {
  const key = command.key ? command.key : toKebab(command.method)
  if (command.caption && !(command.caption instanceof Array)) {
    command.caption = [command.caption]
  }
  commands[key] = command
}

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
  data() {
    return {
      menuData,
      menuKeys,
      menubarMove: 0,
      menubarActive: false,
      altKey: false,
    }
  },

  provide() {
    return {
      execute: this.executeMethod,
    }
  },

  mounted() {
    for (const key in commands) {
      if (!commands[key].bind || commands[key].bind.startsWith('!')) continue
      Mousetrap.bind(commands[key].bind, () => {
        this.executeCommand(key)
        return false
      })
    }
    this.menuReference = {}
    for (let index = 0; index < menuKeys.length; index++) {
      this.menuReference[menuKeys[index]] = this.$refs.menus.$el.children[index]
    }
  },

  methods: {
    executeMethod(method, ...args) {
      if (method in this) this[method](...args)
    },
    executeCommand(key) {
      if (commands[key].method in this) {
        let args = commands[key].arguments
        if (args === undefined) args = []
        if (!(args instanceof Array)) args = [args]
        this[commands[key].method](...args.map(arg => {
          if (typeof arg === 'string' && arg.startsWith('$')) {
            return this[arg.slice(1)]
          } else {
            return arg
          }
        }))
      } else {
        this.$message.error(`No command ${key} was found!`)
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

  components: {
    mklMenus: {
      props: {
        keys: {
          type: Array,
          required: true
        },
        data: {
          type: Object,
          required: true
        },
      },
      components: {
        mklMenu: {
          name: 'mkl-menu',
          inject: ['execute'],
          props: {
            data: {
              type: Array,
              required: true
            },
            embed: {
              type: Array,
              default: () => []
            },
          },
          methods: {
            getBinding(key) {
              let binding = commands[key].bind
              if (!binding) return ''
              if (binding.charAt(0) === '!') binding = binding.slice(1)
              return binding.replace(/[a-z]+/g, word => {
                return word.charAt(0).toUpperCase() + word.slice(1)
              }).replace(/ /g, ', ')
            },
            getCaption(key) {
              return commands[key].name || commands[key].key
            },
            getContext(key) {
              if (commands[key].enabled) {
                return !this.getValue(commands[key].enabled)
              } else {
                return false
              }
            },
            getValue(data) {
              // FIXME: optimize value pattern
              return this.$parent[data.slice(1)]
            },
          },
        }
      },
    }
  }
}

</script>

<template name="mkl-menus">
  <div class="marklet-menus">
    <transition name="el-zoom-in-top" v-for="key in keys" :key="key">
      <ul v-show="data[key].show" class="marklet-menu">
        <mkl-menu :data="data[key].content" :embed="data[key].embed"/>
      </ul>
    </transition>
  </div>
</template>

<template name="mkl-menus.mkl-menu">
  <div class="content marklet-menu">
    <li v-for="(item, index) in data" :key="index">
      <div v-if="(item instanceof Object)">
        <mkl-menu v-show="embed[index]" :data="item.content"/>
      </div>
      <div v-else-if="item === '@separator'" class="menu-item disabled" @click.stop>
        <a class="separator"/>
      </div>
      <div v-else-if="getContext(item)" class="menu-item disabled" @click.stop>
        <a class="label">{{ getCaption(item) }}</a>
        <span class="binding">{{ getBinding(item) }}</span>
      </div>
      <div v-else class="menu-item" @click="execute('executeCommand', item)">
        <a class="label">{{ getCaption(item) }}</a>
        <span class="binding">{{ getBinding(item) }}</span>
      </div>
    </li>
  </div>
</template>

<style lang="scss">

.marklet-menus {
  width: 0;
  height: 0;
  top: 0;
  left: 0;

  ul {
    z-index: 10;
    padding: 0;
    margin: 0;
    outline: 0;
    border: none;
    transition: 0.3s ease;
    position: absolute;
    list-style-type: none;
  }
}

.marklet-menu-enter-active, .marklet-menu-leave-active { 
  transition: 0.3s ease;
  position: absolute;
}

.marklet-menu .content { min-width: 200px }

.marklet-menu .menu-item {
  padding: 0;
  -webkit-user-select: none;
  display: -webkit-flex;
  cursor: pointer;
}

.marklet-menu .menu-item.disabled { cursor: default }

.marklet-menu .menu-item .label {
	flex: 1 1 auto;
	text-decoration: none;
	padding: 0.8em 1em;
	line-height: 1.1em;
  background: none;
  font-size: 12px;
	display: inline-block;
	box-sizing:	border-box;
	margin: 0;
}

.marklet-menu .menu-item .label.active { font-weight: bold }

.marklet-menu .menu-item .binding {
  display: inline-block;
	flex: 2 1 auto;
	padding: 0.8em 1em;
	line-height: 1.1em;
	font-size: 12px;
	text-align: right;
}

.marklet-menu .menu-item .binding i {
  font-size: 9px;
  vertical-align: 1px;
}

.marklet-menu .menu-item .separator {
	flex: 1 1 auto;
  display: block;
  margin: 0.3em 0.5em;
	padding: 1px 0 0 0;
	border-bottom: 1px solid;
	width: 100%;
}

.marklet-menu-list-enter-active, .marklet-menu-list-leave-active {
  transition: 0.3s ease;
}

.marklet-menu-list-enter-active .menu-item, .marklet-menu-list-leave-active .menu-item {
  color: inherit !important;
  background-color: inherit !important;
}

.marklet-menu-list-enter, .marklet-menu-list-leave-to {
  opacity: 0;
  transform: translateX(200px);
}

</style>
