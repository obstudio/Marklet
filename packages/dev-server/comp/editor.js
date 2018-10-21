const { DocumentLexer, defaultConfig } = require('@marklet/parser')

module.exports = {
  data: () => ({
    nodes: [],
    origin: '',
    source: '',
    loading: 3,
    changed: false,
    config: defaultConfig,
  }),

  watch: {
    source(value) {
      this.nodes = this._lexer.parse(value)
    },
    config: {
      deep: true,
      handler(value) {
        this._lexer = new DocumentLexer(value)
        this.nodes = this._lexer.parse(this.source)
      },
    },
    loading(value) {
      if (!value) {
        this._editor.setModel(this._model)
        this.$nextTick(() => this.layout())
      }
    },
  },

  created() {
    this._lexer = new DocumentLexer(defaultConfig)

    const source = localStorage.getItem('source')
    if (typeof source === 'string') this.source = source

    this.$eventBus.$on('server.config', (config) => {
      this.config = Object.assign(defaultConfig, config)
    })

    this.$eventBus.$on('monaco.loaded', (monaco) => {
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
    this.$eventBus.$on('server.document', (doc) => {
      this.openFile(doc)
    })

    this.$eventBus.$on('monaco.theme.loaded', (monaco) => {
      monaco.editor.setTheme(this.theme)
    })

    this.$eventBus.$on('monaco.loaded', (monaco) => {
      if (this._editor) return
      this._editor = monaco.editor.create(this.$refs.editor, {
        model: null,
        language: 'marklet',
        lineDecorationsWidth: 4,
        scrollBeyondLastLine: false,
        minimap: { enabled: false },
        scrollbar: {
          verticalScrollbarSize: 22,
          verticalSliderSize: 12,
        },
      })
      this._editor.onDidChangeCursorPosition((event) => {
        this.row = event.position.lineNumber
        this.column = event.position.column
      })
      this.loading ^= 2
    })

    addEventListener('beforeunload', () => {
      localStorage.setItem('source', this.source)
    })
  },

  methods: {
    openFile(doc) {
      this.source = doc // TODO: need more consideration as another listener monaco.loaded exists
    },
    save() {
      this.$eventBus.$emit('client.message', 'save', this.source) // TODO: maybe file name is needed. depend on backend impl
    },
    saveAs() {
      this.$eventBus.$emit('client.message', 'saveAs', {
        source: this.source,
        name: '' // TODO: read file name
      })
    },
    saveAll() {
      // TODO: unclear requirement
    },
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
    executeAction(id) {
      if (!this._editor) return
      const action = this._editor.getAction(id)
      if (action) action.run(this._editor)
    },
    executeTrigger(id) {
      if (!this._editor) return
      this._editor.trigger(id, id)
    },
  }
}
