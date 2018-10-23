<script>

module.exports = {
  inject: ['$menu'],
  props: ['command', 'mnemonic'],

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
    <span class="label">
      <mkl-checkbox v-if="command.checked !== undefined"
        :value="$menu.parseArgument(command.checked)" @change="handleClick"/>
      {{ command.name }}
      <template v-if="mnemonic"> ({{ mnemonic }})</template>
      <template v-if="command.ellipsis"> ...</template>
    </span>
    <span class="binding">{{ binding }}</span>
  </div>
</template>

<style lang="scss" scoped>

> .label {
  .marklet-checkbox {
    font-size: 12px;
    margin-right: 4px;
    vertical-align: .5px;
  }
}

</style>
