<script>

const { DocumentLexer } = require('@marklet/parser')
const monacoLoader = require('@marklet/monaco')

Vue.use(monacoLoader)

const themes = ['simple', 'dark']

module.exports = {
  el: '#app',

  data: () => ({
    themeInput: '',
    theme: 'dark',
    origin: '',
    source: '',
    nodes: [],
    loading: 3,
    changed: false,
  }),

  watch: {
    source(value) {
      this.nodes = this._lexer.parse(value)
    },
    loading(value) {
      if (!value) {
        this._editor.setModel(this._model)
        this.layout()
      }
    },
    theme(value) {
      if (window.monaco) {
        window.monaco.editor.setTheme(value)
      }
    },
    themeInput(value) {
      if (themes.includes(value)) this.theme = value
    },
  },

  created() {
    const source = localStorage.getItem('source')
    if (typeof source === 'string') this.source = source
    
    this._lexer = new DocumentLexer()

    monacoLoader.then((monaco) => {
      themes.forEach((name) => {
        monaco.editor.defineTheme(name, window.result.themes[name])
      })
      const model = monaco.editor.createModel(this.source, 'marklet')
      model.onDidChangeContent(() => this.checkChange())
      const nodes = this.nodes
      this.nodes = []
      this.$nextTick(() => this.nodes = nodes)
      this._model = model
      this.loading ^= 1
    })
  },

  mounted() {
    window.vm = this
    
    monacoLoader.then((monaco) => {
      monaco.editor.setTheme(this.theme)
      this._editor = monaco.editor.create(this.$refs.input, {
        model: null,
        language: 'marklet',
        lineDecorationsWidth: 4,
        scrollBeyondLastLine: false,
        minimap: { enabled: false },
        scrollbar: {
          verticalScrollbarSize: 20,
          verticalSliderSize: 12,
        },
      })
      this._editor.onDidChangeCursorPosition((event) => {
        this.row = event.position.lineNumber
        this.column = event.position.column
      })
      this.loading ^= 2
    })

    addEventListener('resize', () => {
      this.$refs.input.classList.add('no-transition')
      this.layout()
      this.$refs.input.classList.remove('no-transition')
    }, { passive: true })

    addEventListener('beforeunload', () => {
      localStorage.setItem('source', this.source)
    })
  },

  methods: {
    checkChange(data) {
      if (data !== undefined) this.origin = data
      this.source = this._model.getValue()
      this.changed = this.origin !== this.source
    },
    layout(deltaTime = 0) {
      const now = performance.now(), self = this
      this._editor._configuration.observeReferenceElement()
      this._editor._view._actualRender()
      if (!deltaTime) return
      requestAnimationFrame(function layout(newTime) {
        self._editor._configuration.observeReferenceElement()
        self._editor._view._actualRender()
        if (newTime - now < deltaTime) requestAnimationFrame(layout)
      })
    },
  }
}

</script>

<template>
  <div :class="theme">
    <div class="navbar">
      <mkl-input v-model="themeInput" placeholder="input theme"/>
    </div>
    <div class="input" ref="input"/>
    <mkl-scroll class="document" :margin="4" :radius="6">
      <mkl-nodes ref="nodes" :content="nodes"/>
    </mkl-scroll>
  </div>
</template>

<style lang="scss" scoped>

> .navbar {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 40px;
  box-sizing: border-box;
  border-bottom: 2px solid;

  .mkl-input {
    font-size: 14px;
    padding: 6px 16px;
    max-width: 200px;
  }
}

> .input, > .document {
  position: absolute;
  top: 40px;
  bottom: 0;
}

> .input {
  left: 0;
  width: 50%;
}

> .mkl-scroll {
  left: 50%;
  right: 0;

  > .container {
    padding: 0 24px;
  }
}

</style>
