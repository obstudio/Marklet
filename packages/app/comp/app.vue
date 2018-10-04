<script>

const { DocumentLexer } = require('@marklet/parser')
window.Monaco = require('@marklet/monaco')

Vue.use(require('@marklet/renderer'))

module.exports = {
  el: '#app',

  components: {
    mklTree: require('./tree.vue'),
  },

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
    const source = localStorage.getItem('source')
    if (typeof source === 'string') this.source = source
  },

  mounted() {
    addEventListener('beforeunload', () => {
      localStorage.setItem('source', this.source)
    })
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
    <div class="tree">
      <mkl-tree :ast="nodes">
    </div>
  </div>
</template>

<style lang="scss" scoped>

> .input, > .output, > .tree {
  position: absolute;
  top: 0;
  bottom: 0;
}

> .input {
  left: 0;
  width: 33%;

  > textarea {
    resize: none;
    width: -webkit-fill-available;
    height: -webkit-fill-available;
  }
}

> .output {
  left: 33%;
  right: 33%;
}

> .tree {
  left: 67%;
  right: 0;
}

</style>
