<script>

const { DocumentLexer } = require('@marklet/parser')
const { themes } = require('@marklet/renderer')

module.exports = {
  extends: require('./menu.vue'),

  data: () => ({
    theme: 'dark',
    origin: '',
    source: '',
    nodes: [],
    loading: 3,
    changed: false,
    dragging: false,
    display: {
      document: {
        show: true,
        width: 0.4,
      },
      editor: {
        show: true,
        width: 0.4,
      },
      explorer: {
        show: false,
        width: 0.2,
      },
    },
  }),

  computed: {
    lists() {
      return {
        themes: {
          data: themes,
          current: this.theme,
          switch: 'setTheme',
        },
      }
    },
    editorWidth() {
      return this.display.editor.width / (
        this.display.editor.width
        + this.display.document.width * this.display.document.show
        + this.display.explorer.width * this.display.explorer.show
      ) * 100 + '%'
    },
    editorStyle() {
      const width = this.editorWidth
      const style = { width }
      if (this.display.editor.show) {
        style.left = '0'
      } else {
        style.left = '-' + width
      }
      return style
    },
    documentWidth() {
      return this.display.document.width / (
        this.display.document.width
        + this.display.editor.width * this.display.editor.show
        + this.display.explorer.width * this.display.explorer.show
      ) * 100 + '%'
    },
    documentStyle() {
      const width = this.documentWidth
      const style = { width }
      if (this.display.document.show) {
        style.right = '0'
      } else {
        style.right = '-' + width
      }
      return style
    },
  },

  watch: {
    source(value) {
      this.nodes = this._lexer.parse(value)
    },
    loading(value) {
      if (!value) {
        this._editor.setModel(this._model)
        this.$nextTick(() => this.layout())
      }
    },
  },

  created() {
    const source = localStorage.getItem('source')
    if (typeof source === 'string') this.source = source
    
    this._lexer = new DocumentLexer()

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
    window.vm = this
    
    this.$eventBus.$on('monaco.loaded', (monaco) => {
      if (this._editor) return
      monaco.editor.setTheme(this.theme)
      this._editor = monaco.editor.create(this.$refs.monaco, {
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

    addEventListener('mouseup', (event) => {
      this.layout()
      this.stopDrag(event)
    }, { passive: true })

    addEventListener('mousemove', (event) => {
      if (this.dragging) {
        this.layout()
        event.stopPropagation()
        const toMax = this.extensionHeight <= this.remainHeight || this.draggingLastY < event.clientY
        const toMin = this.extensionHeight >= 36 || this.draggingLastY > event.clientY
        if (toMax && toMin) {
          this.extensionHeight += this.draggingLastY - event.clientY
          this.draggingLastY = event.clientY
        }
      }
    })

    addEventListener('beforeunload', () => {
      localStorage.setItem('source', this.source)
    })
  },

  methods: {
    openFile() {},
    save() {},
    saveAs() {},
    saveAll() {},
    triggerArea(area) {
      this.display[area].show = !this.display[area].show
      this.$nextTick(() => this.layout(300))
    },
    setTheme(theme) {
      this.theme = theme
      if (window.monaco) {
        window.monaco.editor.setTheme(theme)
      }
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
    startDrag(event) {
      this.hideContextMenus()
      this.dragging = true
      this.draggingLastX = event.clientX
    },
    stopDrag() {
      this.dragging = false
    },
  }
}

</script>

<template>
  <div :class="theme" class="marklet"
    @click="hideContextMenus" @contextmenu="hideContextMenus">
    <div class="menubar">
      <div v-for="(menu, index) in menuData.menubar.content" :key="index" class="item"
        @click.stop="showMenu(index, $event)" @mouseover.stop="hoverMenu(index, $event)"
        :class="{ active: menuData.menubar.embed[index] }" @contextmenu.stop>
        {{ menu.name }} (<span>{{ menu.bind }}</span>)&nbsp;
      </div>
    </div>
    <div class="editor" ref="monaco" :style="editorStyle"/>
    <div class="border" @mousedown.stop="startDrag"/>
    <mkl-scroll class="document" :margin="4" :radius="6" :style="documentStyle">
      <mkl-nodes ref="nodes" :content="nodes"/>
    </mkl-scroll>
    <mkl-menus ref="menus" :keys="menuKeys" :data="menuData" :lists="lists"/>
  </div>
</template>

<style lang="scss" scoped>

& {
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  overflow: hidden;
  position: absolute;
}

> .menubar {
  overflow: hidden;
  font-size: 14px;
  left: 0;
  height: 32px;
  width: 100%;
  float: left;
  user-select: none;
  position: relative;

  .item {
    line-height: 24px;
    padding: 4px;
    transition:
      color 0.3s ease,
      background-color 0.3s ease;
    display: inline-block;
  }
}

> .editor, > .document, > .border {
  position: absolute;
  top: 32px;
  bottom: 0;
  height: auto;
  transition:
    left 0.3s ease,
    right 0.3s ease,
    width 0.3s ease;
}

> .border {
  width: 2px;
  z-index: 100;
  margin-left: -1px;
  user-select: none;
  cursor: col-resize;
  transition: 0.3s ease;
}

> .document {
  > .container {
    padding: 0 24px;
  }
}

</style>
