<script>

const { DocumentLexer } = require('@marklet/parser')
const { themes } = require('@marklet/renderer')

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

  extends: require('./menu.vue'),

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
    theme(value) {
      if (window.monaco) {
        window.monaco.editor.setTheme(value)
      }
    },
    themeInput(value) {
      if (themes.find(({ key }) => key === value)) this.theme = value
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
  <div :class="theme" class="marklet"
    @click="hideContextMenus" @contextmenu="hideContextMenus">
    <div class="menubar">
      <div v-for="(menu, index) in menuData.menubar.content" :key="index" class="item"
        @click.stop="showMenu(index, $event)" @mouseover.stop="hoverMenu(index, $event)"
        :class="{ active: menuData.menubar.embed[index] }" @contextmenu.stop>
        {{ menu.name }} (<span>{{ menu.bind }}</span>)
      </div>
    </div>
    <div class="input" ref="input"/>
    <mkl-scroll class="document" :margin="4" :radius="6">
      <mkl-nodes ref="nodes" :content="nodes"/>
    </mkl-scroll>
    <mkl-menus ref="menus" :keys="menuKeys" :data="menuData"/>
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

  > div {
    line-height: 24px;
    padding: 4px;
    transition: 0.3s;
    display: inline-block;
  }
}

> .input, > .document {
  position: absolute;
  top: 32px;
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
