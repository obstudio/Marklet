<script>

module.exports = {
  props: ['node'],

  data: () => ({
    html: '',
  }),

  watch: {
    node: 'render',
  },

  mounted() {
    this.render()
  },

  methods: {
    render() {
      if (this.$colorize) {
        this
          .$colorize(this.node.text, this.node.lang)
          .then(result => this.html = result)
      } else {
        this.html = this.node.text.replace(/\r?\n/g, '<br/>')
      }
    }
  }
}

</script>

<template>
  <div class="mkl-codeblock" v-html="html"/>
</template>

<style lang="scss" scoped>

& {
  font-family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, Courier, monospace;
  border-radius: 6px;
  padding: 4px 8px;
  font-size: 88%;
  margin-bottom: 16px;
  white-space: nowrap;
  overflow-x: auto;
  overflow-y: hidden;

  &::-webkit-scrollbar { height: 8px }
  &::-webkit-scrollbar-thumb { border-radius: 4px }
}

</style>
