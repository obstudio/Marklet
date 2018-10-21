let _Vue = null, ASTNodes = null

const components = {
  'collapse-transition': require('@/transitions/collapse-transition.vue'),
  'mkl-codeblock': require('@/codeblock.vue'),
  'mkl-collapse': require('@/collapse.vue'),
  'mkl-heading': require('@/heading.vue'),
  'mkl-inlinelist': require('@/inlinelist.vue'),
  'mkl-input': require('@/input.vue'),
  'mkl-list-item': require('@/list-item.vue'),
  'mkl-list': require('@/list.vue'),
  'mkl-nodes': require('@/nodes.vue'),
  'mkl-paragraph': require('@/paragraph.vue'),
  'mkl-quote': require('@/quote.vue'),
  'mkl-scroll': require('@/scroll.vue'),
  'mkl-section': require('@/section.vue'),
  'mkl-separator': require('@/separator.vue'),
  'mkl-table': require('@/table.vue'),
  'mkl-usages': require('@/usages.vue'),
}

const Renderer = {
  components,
  themes: require('../themes'),
  install(Vue) {
    _Vue = Vue
    for (const key in components) {
      Vue.component(key, components[key])
    }
  },
  embed(element, content = []) {
    if (!_Vue) {
      if (typeof window === 'object' && window && window.Vue) {
        (_Vue = window.Vue).use(Renderer)
      } else {
        throw new Error('No vue constructor was found.')
      }
    }
    if (!ASTNodes) ASTNodes = _Vue.extend(components['mkl-nodes'])
    new ASTNodes({ propsData: { content } }).$mount(element)
  }
}

module.exports = Renderer
