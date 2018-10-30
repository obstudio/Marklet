<script>

const { themes } = require('@marklet/renderer')

const MIN_WIDTH = 0.1

module.exports = {
  mixins: [
    require('./editor'),
  ],

  components: {
    fileTree: require('./tree.vue')
  },

  provide() {
    return { $editor: this }
  },

  data: () => ({
    themes,
    theme: 'dark',
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
    totalWidth() {
      return this.display.editor.width * this.display.editor.show
        + this.display.explorer.width * this.display.explorer.show
        + this.display.document.width * this.display.document.show
    },
    totalShow() {
      return this.display.editor.show
        + this.display.document.show
        + this.display.explorer.show
    },
    explorerWidth() {
      return this.display.explorer.width / (
        this.display.explorer.width
        + this.display.editor.width * this.display.editor.show
        + this.display.document.width * this.display.document.show
      ) * 100 + '%'
    },
    explorerStyle() {
      const width = this.explorerWidth
      const style = { width }
      if (this.display.explorer.show) {
        style.left = '0'
        style.zIndex = 1
      } else {
        style.left = '-' + width
      }
      if (!this.totalShow) style.opacity = '0'
      return style
    },
    leftBorderStyle() {
      const style = {}
      if (this.display.explorer.show) {
        style.left = this.totalShow > 1 ? this.explorerWidth : '100%'
        if (this.totalShow > 1) {
          style.opacity = 1
          style.cursor = 'col-resize'
        }
      }
      return style
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
      if (this.display.explorer.show) {
        if (this.display.document.show) {
          style.left = this.display.explorer.width * 100 + '%'
        } else {
          style.left = this.explorerWidth
        }
      } else {
        style.left = '0'
      }
      if (this.display.editor.show) style.zIndex = '1'
      if (!this.totalShow) style.opacity = '0'
      return style
    },
    rightBorderStyle() {
      const style = {}
      if (this.display.document.show) {
        style.right = this.totalShow > 1 ? this.documentWidth : '100%'
        if (this.totalShow > 1) {
          style.opacity = 1
          style.cursor = 'col-resize'
        }
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
        style.zIndex = 1
      } else {
        style.right = '-' + width
      }
      if (!this.totalShow) style.opacity = '0'
      return style
    },
  },

  created() {
    this.$set(this.display.editor, 'show', this._enableEdit)
    this.$set(this.display.explorer, 'show', this._isProject)

    this.$registerCommands(require('./command'))
    this.$registerMenus(require('./menus'))
  },

  mounted() {
    window.vm = this

    addEventListener('resize', () => {
      this.dragging = true
      this.layout()
      this.dragging = null
    }, { passive: true })

    addEventListener('mouseup', () => {
      this.layout()
      this.$refs.left.classList.remove('active')
      this.$refs.right.classList.remove('active')
      this.dragging = null
    }, { passive: true })

    addEventListener('mousemove', (event) => {
      let left, right
      if (this.dragging === 'left') {
        left = 'explorer'
        if (this.display.editor.show) {
          right = 'editor'
        } else if (this.display.document.show) {
          right = 'document'
        } else return
      } else if (this.dragging === 'right') {
        right = 'document'
        if (this.display.editor.show) {
          left = 'editor'
        } else if (this.display.explorer.show) {
          left = 'explorer'
        } else return
      } else return

      this.layout()
      event.stopPropagation()

      const baseWidth = innerWidth / this.totalWidth
      const deltaX = (this.draggingLastX - event.clientX) / baseWidth
      this.draggingLastX = event.clientX
      if (this.display[left].width - deltaX < MIN_WIDTH) {
        this.draggingLastX += (MIN_WIDTH - this.display[left].width + deltaX) * baseWidth
        this.display[right].width += this.display[left].width - MIN_WIDTH
        this.display[left].width = MIN_WIDTH
      } else if (this.display[right].width + deltaX < MIN_WIDTH) {
        this.draggingLastX -= (MIN_WIDTH - this.display[right].width - deltaX) * baseWidth
        this.display[left].width -= MIN_WIDTH - this.display[right].width
        this.display[right].width = MIN_WIDTH
      } else {
        this.display[left].width -= deltaX
        this.display[right].width += deltaX
      }
    })
  },

  methods: {
    windowOpen(url) {
      window.open(url)
    },
    triggerArea(area) {
      if (area === 'explorer' && !this._isProject) return
      if (area === 'editor' && !this._enableEdit) return
      
      this.display[area].show = !this.display[area].show
      if (this.display.editor.show) {
        this.$nextTick(() => this.layout(300))
      }
    },
    setTheme(theme) {
      this.theme = theme
      if (window.monaco) {
        window.monaco.editor.setTheme(theme)
      }
    },
    startDrag(position, event) {
      this.$menuManager.hideAllMenus()
      this.dragging = position
      this.$refs[position].classList.add('active')
      this.draggingLastX = event.clientX
    },
  }
}

</script>

<template>
  <div :class="[theme, { dragging }]" class="marklet">
    <div class="menubar">
      <ob-menubar from="menubar"/>
      <span class="title">{{ currentFile.path || 'Untitled' }}</span>
    </div>
    <file-tree class="view explorer" :style="explorerStyle" :tree="tree"/>
    <div class="border left" ref="left" :style="leftBorderStyle"
      @mousedown.stop="startDrag('left', $event)"/>
    <div class="view editor" ref="editor" :style="editorStyle"/>
    <div class="border right" ref="right" :style="rightBorderStyle"
      @mousedown.stop="startDrag('right', $event)"/>
    <mkl-scroll class="view document" :style="documentStyle" :margin="4" :radius="6">
      <mkl-nodes ref="nodes" :content="nodes"/>
    </mkl-scroll>
  </div>
</template>

<style lang="scss" scoped>

$-menubar-height: 32px;

& {
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  overflow: hidden;
  position: absolute;
}

> .menubar {
  width: 100%;
  display: inline-flex;
  height: $-menubar-height;

  > .ob-menubar {
    width: auto;
  }

  > .title {
    flex-grow: 1;
    font-size: 14px;
    text-align: center;
    line-height: $-menubar-height;
  }
}

> .view, > .border {
  position: absolute;
  top: $-menubar-height;
  bottom: 0;
  z-index: 0;
  height: auto;
  transition:
    left 0.3s ease,
    right 0.3s ease,
    width 0.3s ease,
    opacity 0.3s ease;
}

> .view {
  opacity: 1;
}

&.dragging {
  > .view, > .border {
    transition: none !important;
  }
}

> .border {
  width: 2px;
  z-index: 2;
  opacity: 0;
  user-select: none;
  transition: 0.3s ease;

  &.left {
    left: 0;
    margin-left: -1px;
  }

  &.right {
    right: 0;
    margin-right: -1px;
  }
}

> .document {
  > .container {
    padding: 0 24px;
  }
}

</style>
