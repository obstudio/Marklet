<script>

const menuItem = require('./menu-item.vue')

module.exports = {
  name: 'menu-view',

  components: { menuItem },

  props: {
    menu: Array,
    context: Object,
  },

  data: () => ({
    chosen: null,
    active: false,
    children: [],
  }),

  computed: {
    current: {
      get() {
        const index = this.children.findIndex(submenu => submenu && submenu.active)
        return index < 0 ? null : index
      },
      set(value) {
        this.children.forEach((submenu, index) => {
          if (!submenu) return
          submenu.active = index === value
        })
      },
    },
    focused() {
      return this.active && this.current === null
    },
  },

  mounted() {
    addEventListener('keydown', this.handleKeyDown)
    addEventListener('keypress', this.handleKeyPress)

    this.children = this.menu.map((item, index) => {
      if (!item.children) return
      return this.$refs[index][0]
    })
  },

  beforeDestroy() {
    removeEventListener('keydown', this.handleKeyDown)
    removeEventListener('keypress', this.handleKeyPress)
  },

  methods: {
    handleKeyDown(event) {
      if (!this.focused) return
      console.log(event.key, event.keyCode)
      if (event.keyCode === 8) {
        event.preventDefault()
        event.stopPropagation()
        this.$nextTick(() => this.$parent.current = null)
      }
    },
    handleKeyPress(event) {
      if (!this.focused) return
      const key = event.key.toUpperCase()
      const index = this.menu.findIndex(item => item.mnemonic === key)
      if (index >= 0) {
        event.preventDefault()
        event.stopPropagation()
        this.toggleMenuItem(index)
        this.$menuManager.underlineMnemonic = true
      }
    },
    toggleMenuItem(index) {
      const item = this.menu[index]
      if (item.children) {
        this.enterMenuItem(index)
      } else if (!item.disabled) {
        if (item.command) {
          this.$menuManager.hideAllMenus()
          this.$menuManager.executeCommand(item.command)
        }
      }
    },
    enterMenuItem(index) {
      const style = this.$refs.standalone.style
      const button = this.$refs.body.children[index]
      this.$menuManager.locateAtLeftRight(style, button, -2)
      this.$refs[index][0].active = true
    },
    leaveMenuItem(index, event) {
      const x = event.clientX
      const y = event.clientY
      const rect = this.$refs.body.getBoundingClientRect()
      if (x >= rect.left && x <= rect.right && y >= rect.left && y <= rect.right) {
        this.$refs[index][0].active = false
      }
    },
    traverse(callback) {
      callback(this)
      this.menu.forEach((item, index) => {
        if (item.children) {
          const submenu = this.$refs[index][0]
          callback(submenu)
          submenu.traverse(callback)
        }
      })
    },
  },
}

</script>

<template>
  <span class="marklet-menu" :class="{ active }">
    <!-- children --><!-- eslint-disable -->
    <div ref="standalone" :class="{ standalone: current !== null }">
      <menu-view v-for="(item, index) in menu" v-if="item.children" :key="index"
        :menu="item.children" :context="context" :ref="index"/>
    </div>

    <div ref="body" v-show="active" :class="['menu-body', { focused }]">
      <template v-for="(item, index) in menu">
        <!-- submenu -->
        <menu-item :key="index" v-if="item.children"
          @click.native.stop binding=">" :context="context"
          :caption="item.caption" :mnemonic="item.mnemonic"
          @mouseenter.native="enterMenuItem(index, $event)"
          @mouseleave.native="leaveMenuItem(index, $event)"/>

        <!-- command -->
        <menu-item :key="index" v-else-if="item.command" :context="context"
          :mnemonic="item.mnemonic" :command="$menuManager.commands[item.command]"/>
        
        <!-- list -->
        <transition-group :key="index" v-else-if="item.switch" name="ob-menu-list">
          <menu-item v-for="(sub, index) in $menuManager.parseArgument(item.data, context)"
            :key="index" :context="context" :caption="sub.name"
            :class="{ active: sub.key === $menuManager.parseArgument(item.current, context) }"
            @click.native="$menuManager.executeMethod(context, item.switch, sub.key)"/>
        </transition-group>

        <!-- caption -->
        <div :key="index" v-else class="menu-item disabled" @click.stop>
          <div v-if="item.caption === '-'" class="separator"/>
          <div v-else class="caption">{{ item.caption }}</div>
        </div>
      </template>
    </div>
  </span>
</template>

<style lang="scss" scoped>

& {
  position: relative;
}

> .standalone {
  z-index: 10;
  padding: 0;
  margin: 0;
  outline: 0;
  border: none;
  min-width: 200px;
  user-select: none;
  width: max-content;
  position: absolute;
  transition: 0.3s ease;
}

.menu-body {
  padding: 2px 0;

  &:not(.focused) {
    .mnemonic {
      text-decoration: none;
    }
  }
}

.menu-item {
  padding: 0;
  display: flex;
  cursor: pointer;
  font-size: 12px;

  > .separator {
    margin: 0.3em 0.5em;
    padding: 1px 0 0 0;
    border-bottom: 1px solid;
    width: 100%;
  }

  > .caption {
    font-size: 12px;
    margin: 0.4em auto 0.2em;
  }

  > .label {
    flex: 1 1 auto;
    padding: 0.8em 1em;
    line-height: 1.1em;
    background: none;
    display: inline-block;
    margin: 0;
    
    &.active { font-weight: bold }
  }

  > .binding {
    display: inline-block;
    flex: 2 1 auto;
    padding: 0.8em 1em;
    line-height: 1.1em;
    text-align: right;
  }

  &.disabled {
    pointer-events: none;
    cursor: default !important;
  }
}

.ob-menu-enter-active,
.ob-menu-leave-active {
  opacity: 1;
  transform: scaleY(1);
  transform-origin: center top;
  transition:
    transform 0.3s cubic-bezier(0.23, 1, 0.32, 1),
    opacity 0.3s cubic-bezier(0.23, 1, 0.32, 1);
}

.ob-menu-enter,
.ob-menu-leave-to {
  opacity: 0;
  transform: scaleY(0);
}

</style>
