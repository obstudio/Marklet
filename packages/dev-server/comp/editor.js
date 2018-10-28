const { DocumentLexer, defaultConfig } = require('@marklet/parser')

module.exports = {
  data: () => ({
    tree: [],
    nodes: [],
    origin: '',
    source: '',
    loaded: false,
    changed: false,
    files: {},
    config: {
      ...defaultConfig,
      ...marklet.parseOptions,
    },
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
  },

  created() {
    this._enableEdit = marklet.serverType === 'edit'
    this._isProject = marklet.sourceType !== 'file'
    this._lexer = new DocumentLexer(this.config)

    const source = localStorage.getItem('source')
    if (typeof source === 'string') this.source = source
  },

  mounted() {
    if (process.env.MARKLET_ENV === 'development') {
      marklet.$on('server.message', (event) => {
        console.log('server.' + event.type, event)
      })
    }

    marklet.$on('server.entries', ({ tree }) => {
      this.tree = tree
    })

    marklet.$on('server.document', ({ value, path }) => {
      if (this.files[path]) {
        this.files[path].value = value
      } else {
        this.files[path] = new marklet.File({ path, value })
      }
    })

    marklet.$on('monaco.theme.loaded', (monaco) => {
      monaco.editor.setTheme(this.theme)
    })

    marklet.$on('monaco.loaded', (monaco) => {
      const model = monaco.editor.createModel(this.source, 'marklet')
      model.onDidChangeContent(() => this.checkChange())
      const nodes = this.nodes
      this.nodes = []
      this.$nextTick(() => this.nodes = nodes)
      this._model = model

      if (this._editor) return
      this._editor = monaco.editor.create(this.$refs.editor, {
        model: null,
        language: 'marklet',
        lineDecorationsWidth: 8,
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
      this._editor.setModel(this._model)
      this.$nextTick(() => this.layout())
      this.loaded = true
    })

    addEventListener('beforeunload', () => {
      localStorage.setItem('source', this.source)
    })
  },

  methods: {
    openFile(doc) {
      if (this.loaded) {
        this._model.setValue(doc)
      } else {
        this.source = doc
      }
    },
    save() {
      // try to use functional APIs instead of events
      // TODO: maybe file name is needed. depend on backend impl
      marklet.$emit('client.message', 'save', this.source)
    },
    saveAs() {
      marklet.$emit('client.message', 'saveAs', {
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
      if (!this._editor) return
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
