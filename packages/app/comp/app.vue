<script>

const { DocumentLexer } = require('@marklet/parser')

Vue.use(require('@marklet/renderer'))

module.exports = {
  el: '#app',

  data: () => ({
    source: '',
    nodes: [],
  }),

  watch: {
    source(value) {
      this.nodes = this.lexer.parse(value)
    },
  },

  created() {
    this.lexer = new DocumentLexer()
  },
}

</script>

<template>
  <div>
    <div class="input">
      <textarea v-model="source"/>
    </div>
    <div class="output">
      <mkl-nodes :content="nodes"/>
    </div>
  </div>
</template>

<style lang="scss" scoped>

> .input, > .output {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 50%;
}

> .input {
  left: 0;

  > textarea {
    resize: none;
    width: -webkit-fill-available;
    height: -webkit-fill-available;
  }
}

> .output { right: 0 }

</style>
