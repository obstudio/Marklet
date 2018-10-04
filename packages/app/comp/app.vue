<script>

const { DocumentLexer } = require('@marklet/parser')
const monacoPlugin = require('@marklet/monaco').install()

module.exports = {
  el: '#app',

  data: () => ({
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
    }
  },

  created() {
    const source = localStorage.getItem('source')
    if (typeof source === 'string') this.source = source
    
    this._lexer = new DocumentLexer()

    monacoPlugin.then((monaco) => {
      const model = monaco.editor.createModel(this.source, 'marklet')
      model.onDidChangeContent(() => this.checkChange())
      this._model = model
      this.loading ^= 1
    })
  },

  mounted() {
    window.vm = this
    
    monacoPlugin.then((monaco) => {
      monaco.editor.setTheme('vs')
      this._editor = monaco.editor.create(this.$refs.input, {
        model: null,
        language: 'mkl',
        lineDecorationsWidth: 4,
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
  <div>
    <div class="input" ref="input"/>
    <mkl-scroll class="output" :margin="4" :radius="6">
      <mkl-nodes :content="nodes"/>
    </mkl-scroll>
  </div>
</template>

<style lang="scss" scoped>

> .input, > .output {
  position: absolute;
  top: 0;
  bottom: 0;
}

> .input {
  left: 0;
  width: 50%;
}

> .output {
  left: 50%;
  right: 0;

  > .container {
    padding: 0 24px;
  }
}

.monaco-editor {
  .monaco-scrollable-element {
    > .scrollbar {
      transition: opacity 0.3s ease;

      > .slider {
        opacity: 0.5;
        border-radius: 6px;
        background-color: #c0c4cc;
      }

      &.vertical {
        margin: 4px 0;
      }

      &.horizontal {
        margin: 0 4px;
      }

      &.invisible.fade {
        transition: opacity 0.8s ease;
      }
    }
  }
}

</style>
