<script>

module.exports = {
  name: 'marklet-menu-view',
  inject: ['commands', '$menu'],
  props: ['data', 'current'],
  components: {
    MarkletMenuList: require('./menu-list.vue'),
    MarkletMenuItem: require('./menu-item.vue'),
  },

  methods: {
    enterMenuItem(key, event) {
      const style = this.$menu.menuReference[key].style
      this.$menu.locateAtLeftRight(event, style)
      this.$menu.menuData[key].show = true
    },
    leaveMenuItem(key, event) {
      const x = event.clientX
      const y = event.clientY
      const rect = this.$el.getBoundingClientRect()
      if (x >= rect.left && x <= rect.right && y >= rect.left && y <= rect.right) {
        this.$menu.menuData[key].show = false
      }
    },
  },
}

</script>

<template>
  <div>
    <template v-for="(item, index) in data">
      <template v-if="typeof item === 'object'">
        <template v-if="item.ref">
          <marklet-menu-item :key="index" @click.stop binding=">"
            :caption="item.caption" :mnemonic="item.mnemonic"
            @mouseenter.native="enterMenuItem(item.ref, $event)"
            @mouseleave.native="leaveMenuItem(item.ref, $event)"/>
        </template>
        <template v-if="item.children">
          <marklet-menu-view :key="index" v-show="current === index" :data="item.children"/>
        </template>
        <marklet-menu-item :key="index" v-else-if="item.command"
          :command="commands[item.command]" :mnemonic="item.mnemonic"/>
        <marklet-menu-list :key="index" v-else :list="item"/>
      </template>
      <div :key="index" v-else-if="item === '@separator'" class="menu-item disabled" @click.stop>
        <div class="separator"/>
      </div>
      <marklet-menu-list :key="index" v-else :list="$menu.lists[item.slice(1)]"/>
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

