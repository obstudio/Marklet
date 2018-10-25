<script>

const util = require('./util')
const menuItem = require('./menu-item.vue')

module.exports = {
  name: 'menu-view',

  components: { menuItem },

  props: {
    menu: Object,
  },

  data: () => ({
    active: false,
    current: null,
    focused: false,
  }),

  watch: {
    show(value) {
      this.focused = value
    },
    current(value) {
      if (value !== null) {
        this.$refs[value].active = true
      }
    },
  },

  mounted() {
    addEventListener('keypress', (event) => {
      if (!this.show) return
      const key = event.key.toUpperCase()
      const index = this.menu.findIndex(menu => menu.mnemonic === key)
      if (index >= 0) {
        this.toggleMenuItem(index)
      }
    })
  },

  methods: {
    toggleMenuItem(index) {
      const item = this.menu[index]
      if (typeof item !== 'object') return
      if (item.ref) {
        this.enterMenuItem()
      } else if (!item.disabled && !item.children) {
        if (item.command) {
          this.$menuManager.executeCommand(item.command)
        }
      }
    },
    enterMenuItem(index) {
      const style = this.$refs[index][0].$el.style
      const button = this.$refs.body.children[index]
      util.locateAtLeftRight(style, button)
      this.$refs[index][0].active = true
    },
    leaveMenuItem(index, event) {
      const x = event.clientX
      const y = event.clientY
      const rect = this.$el.getBoundingClientRect()
      if (x >= rect.left && x <= rect.right && y >= rect.left && y <= rect.right) {
        this.$refs[index][0].active = false
      }
    },
  },
}

</script>

<template>
  <!-- eslint-disable -->
  <div class="marklet-menu" :class="{ active }">
    <span ref="body" v-show="active && current === null || $parent.active">
      <template v-for="(item, index) in menu">
        <!-- submenu -->
        <menu-item :key="index" v-if="item.children"
          @click.native.stop binding=">"
          :caption="item.caption" :mnemonic="item.mnemonic"
          @mouseenter.native="enterMenuItem(index, $event)"
          @mouseleave.native="leaveMenuItem(index, $event)"/>

        <!-- command -->
        <menu-item :key="index" v-else-if="item.command"
          :command="$menuManager.commands[item.command]" :mnemonic="item.mnemonic"/>
        
        <!-- list -->
        <transition-group :key="index" v-else-if="item.switch" name="ob-menu-list">
          <menu-item v-for="(sub, index) in $menuManager.parseArgument(item.data)" :key="index"
            :class="{ active: sub.key === $menuManager.parseArgument(item.current) }"
            @click.native="$menuManager.executeMethod(item.switch, sub.key)" :caption="sub.name"/>
        </transition-group>

        <!-- caption -->
        <div :key="index" v-else class="menu-item disabled" @click.stop>
          <div v-if="item.caption === '-'" class="separator"/>
          <div v-else class="caption">{{ item.caption }}</div>
        </div>
      </template>
    </span>

    <!-- children -->
    <menu-view v-for="(item, index) in menu" v-if="item.children" :key="index"
      :menu="item.children" :ref="index" v-show="!active || current === index"/>
  </div>
</template>

<style lang="scss" scoped>

& {
  position: relative;
}

&.active {
  z-index: 10;
  padding: 0;
  margin: 0;
  outline: 0;
  border: none;
  padding: 2px 0;
  min-width: 200px;
  user-select: none;
  width: max-content;
  position: absolute;
  transition: 0.3s ease;
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
