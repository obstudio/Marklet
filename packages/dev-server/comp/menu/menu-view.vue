<script>

module.exports = {
  name: 'menu-view',
  props: ['data'],
  components: {
    MenuItem: require('./menu-item.vue'),
  },

  mounted() {
    addEventListener('keypress', (event) => {
      if (!!this.data.show || !this.data.focused) return
      const key = event.key.toUpperCase()
      const index = this.data.children.findIndex(menu => menu.mnemonic === key)
      if (index >= 0) {
        this.toggleMenuItem(index)
      }
    })
  },

  methods: {
    toggleMenuItem(index) {
      const item = this.data.children[index]
      if (typeof item !== 'object') return
      if (item.ref) {
        this.enterMenuItem()
      } else if (!item.disabled && !item.children) {
        if (item.command) {
          this.$menuManager.executeCommand(item.command)
        }
      }
    },
    enterMenuItem(key, index) {
      const style = this.$menuManager.$refs[key][0].$el.style
      const rect = this.$el.children[index].getBoundingClientRect()
      this.$menuManager.locateAtLeftRight(rect, style)
      this.$menuManager.menuData[key].show = true
    },
    leaveMenuItem(key, event) {
      const x = event.clientX
      const y = event.clientY
      const rect = this.$el.getBoundingClientRect()
      if (x >= rect.left && x <= rect.right && y >= rect.left && y <= rect.right) {
        this.$menuManager.menuData[key].show = false
      }
    },
  },
}

</script>

<template>
  <div :class="{ focused: data.focused }">
    <template v-for="(item, index) in data.children">
      <div :key="index" v-if="item === '@separator'" class="menu-item disabled" @click.stop>
        <div class="separator"/>
      </div>
      <menu-item :key="index" v-else-if="item.ref"
        @click.native.stop binding=">"
        :caption="item.caption" :mnemonic="item.mnemonic"
        @mouseenter.native="enterMenuItem(item.ref, index)"
        @mouseleave.native="leaveMenuItem(item.ref, $event)"/>
      <menu-view :key="index" v-else-if="item.children"
        v-show="data.current === index" :data="item"/>
      <menu-item :key="index" v-else-if="item.command"
        :command="$menuManager._commands[item.command]" :mnemonic="item.mnemonic"/>
      <transition-group :key="index" v-else name="ob-menu-list">
        <menu-item v-for="(sub, index) in $menuManager.parseArgument(item.data)" :key="index"
          :class="{ active: sub.key === $menuManager.parseArgument(item.current) }"
          @click.native="$menuManager.executeMethod(item.switch, sub.key)" :caption="sub.name"/>
      </transition-group>
    </template>
  </div>
</template>

<style lang="scss" scoped>

& {
  min-width: 200px;
  user-select: none;
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

</style>

