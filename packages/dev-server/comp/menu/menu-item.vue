<script>

module.exports = {
  inject: ['$menu'],
  props: ['command'],

  computed: {
    disabled() {
      if (!this.command.enabled) return
      return !this.$menu.parseArgument(this.command.enabled)
    },
    binding() {
      let binding = this.command.bind
      if (!binding) return ''
      if (binding.charAt(0) === '!') binding = binding.slice(1)
      return binding.replace(/[a-z]+/g, word => {
        return word.charAt(0).toUpperCase() + word.slice(1)
      }).replace(/ /g, ', ')
    },
  },

  methods: {
    handleClick() {
      if (this.disabled) return
      this.$menu.executeCommand(this.command)
    }
  },
}

</script>

<template>
  <div :class="['menu-item', { disabled }]" @click="handleClick">
    <span class="label">{{ command.name }}</span>
    <span class="binding">
      <mkl-checkbox v-if="command.checked !== undefined"
        :value="$menu.parseArgument(command.checked)" @change="handleClick"/>
      <template v-else>{{ binding }}</template>
    </span>
  </div>
</template>

<style lang="scss" scoped>

> .binding {
  .marklet-checkbox {
    font-size: 12px;
  }
}

</style>
