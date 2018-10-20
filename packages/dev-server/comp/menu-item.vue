<script>

module.exports = {
  inject: ['parse', 'execute'],
  props: ['command'],

  computed: {
    disabled() {
      if (!this.command.enabled) return
      return !this.parse(this.command.enabled)
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
      this.execute('executeCommand', this.command)
    }
  },
}

</script>

<template>
  <div class="menu-item" :class="{ disabled }" @click="handleClick">
    <span class="label">
      <mkl-checkbox v-if="command.checked !== undefined"
        :value="parse(command.checked)" @change="handleClick"/>
      {{ command.name }}
    </span>
    <span class="binding">{{ binding }}</span>
  </div>
</template>

<style lang="scss" scoped>

> .label {
  flex: 1 1 auto;
  text-decoration: none;
  padding: 0.8em 1em;
  line-height: 1.1em;
  background: none;
  display: inline-block;
  margin: 0;

  .marklet-checkbox {
    font-size: 12px;
    margin-right: 4px;
    vertical-align: 1px;
  }
}

> .binding {
  display: inline-block;
  flex: 2 1 auto;
  padding: 0.8em 1em;
  line-height: 1.1em;
  text-align: right;
}

</style>
