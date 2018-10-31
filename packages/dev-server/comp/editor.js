const { DocumentLexer, defaultConfig } = require('@marklet/parser')
const saveAs = require('file-saver')

module.exports = {
  data: () => ({
    tree: [],
    nodes: [],
    files: marklet.files,
    path: '__untitled__',
    config: {
      ...defaultConfig,
      ...marklet.parseOptions,
    },
  }),

  computed: {
    current() {
      return this.files.get(this.path)
    },
  },

  watch: {
    'current.value': 'parse',
    path() {
      if (!this._editor) return
      this._editor.setModel(this.current.model)
    },
    config: {
      deep: true,
      handler(config) {
        this._lexer = new DocumentLexer(config)
        this.parse()
      },
    },
  },

  created() {
    this._enableEdit = marklet.serverType === 'edit'
    this._isProject = marklet.sourceType !== 'file'
    this._lexer = new DocumentLexer(this.config)
  },

  mounted() {
    marklet.$on('server.entries', ({ tree }) => {
      this.tree = tree
    })

    marklet.$on('server.document', ({ value, path }) => {
      this.files.add({ value, path })
      if (this.path === '__untitled__') {
        this.path = path
      }
    })

    marklet.$on('monaco.theme.loaded', (monaco) => {
      monaco.editor.setTheme(this.theme)
    })

    marklet.$on('monaco.loaded', (monaco) => {
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
      this.$nextTick(() => this.activate())
    })
  },

  methods: {
    parse(source = this.current.value) {
      this.nodes = this._lexer.parse(source)
    },
    switchTo(path) {
      if (this.path === path) return
      if (!this.files.get(path)) return
      this.current.viewState = this._editor.saveViewState()
      this.path = path
      this.activate()
    },
    openFile() {
      //
    },
    save() {
      marklet.$emit('client.message', {
        type: 'save',
        path: this.path,
        value: this.current.value,
      })
    },
    saveAs() {
      const blob = new Blob([this.current.value], {
        type: 'text/plain;charset=utf-8'
      })
      saveAs(blob, this.path.match(/[^/]*$/)[0] || 'download.mkl')
    },
    saveAll() {
      this.files.each((file) => {
        if (!file.changed) return
        marklet.$emit('client.message', {
          type: 'save',
          path: file.path,
          value: file.value,
        })
      })
    },
    activate() {
      if (!this._editor) return
      monaco.editor.setTheme(this.theme)
      this._editor.setModel(this.current.model)
      if (this.current.viewState) {
        this._editor.restoreViewState(this.current.viewState)
      }
      const position = this._editor.getPosition()
      this.row = position.lineNumber
      this.column = position.column
      this.parse()
      this.layout()
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
