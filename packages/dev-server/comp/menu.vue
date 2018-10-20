<script>

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
    const self = this
    return {
      parse(arg) {
        return self.parseArgument(arg)
      },
      execute(key, ...args) {
        const method = self[key]
        if (method instanceof Function) method(...args)
      },
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
        lists: {
          type: Array,
          default: () => []
        },
      },
      components: {
        mklMenu: {
          name: 'mkl-menu',
          inject: ['execute', 'parse'],
          props: {
            data: {
              type: Array,
              required: true
            },
            embed: {
              type: Array,
              default: () => []
            },
            lists: {
              type: Array,
              default: () => []
            },
          },
          components: {
            mklMenuList: require('./menu-list.vue'),
            mklMenuItem: require('./menu-item.vue'),
          },
          methods: {
            getCommand(key) {
              const command = commands[key]
              if (!command) {
                console.error(`key ${key} not found`)
                return {}
              } else {
                return command
              }
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
    <transition name="marklet-menus" v-for="key in keys" :key="key">
      <ul v-show="data[key].show">
        <mkl-menu :data="data[key].content" :embed="data[key].embed" :lists="lists"/>
      </ul>
    </transition>
  </div>
</template>

<template name="mkl-menus.mkl-menu">
  <div class="marklet-menu">
    <template v-for="(item, index) in data" :key="index">
      <template v-if="(item instanceof Object)">
        <mkl-menu v-show="embed[index]" :data="item.content" :lists="lists"/>
      </template>
      <div v-else-if="item === '@separator'" class="menu-item disabled" @click.stop>
        <div class="separator"/>
      </div>
      <div v-else-if="item.startsWith('#')" class="menu-item disabled" @click.stop>
        <div class="caption">{{ item.slice(1) }}</div>
      </div>
      <mkl-menu-list v-else-if="item.startsWith('@')" :list="lists[item.slice(1)]"/>
      <mkl-menu-item v-else :command="getCommand(item)"/>
    </template>
  </div>
</template>

<style lang="scss">

.marklet-menus-enter-active,
.marklet-menus-leave-active {
  opacity: 1;
  transform: scaleY(1);
  transform-origin: center top;
  transition:
    transform 300ms cubic-bezier(0.23, 1, 0.32, 1),
    opacity 300ms cubic-bezier(0.23, 1, 0.32, 1);
}

.marklet-menus-enter,
.marklet-menus-leave-to {
  opacity: 0;
  transform: scaleY(0);
}

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

.marklet-menu {
  min-width: 200px;
  user-select: none;

  .menu-item {
    padding: 0;
    display: flex;
    cursor: pointer;
    font-size: 12px;

    .separator {
      margin: 0.3em 0.5em;
      padding: 1px 0 0 0;
      border-bottom: 1px solid;
      width: 100%;
    }

    .caption {
      font-size: 12px;
      margin: 0.4em auto 0.2em;
    }

    &.disabled { cursor: default }
  }
}

</style>
