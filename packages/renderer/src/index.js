let _Vue = null, ASTNodes = null

const Renderer = {
  install(Vue) {
    _Vue = Vue
    Vue.component('collapse-transition', require('../temp/transitions/collapse-transition.vue'))
    Vue.component('mkl-codeblock', require('../temp/codeblock.vue'))
    Vue.component('mkl-collapse', require('../temp/collapse.vue'))
    Vue.component('mkl-heading', require('../temp/heading.vue'))
    Vue.component('mkl-inlinelist', require('../temp/inlinelist.vue'))
    Vue.component('mkl-input', require('../temp/input.vue'))
    Vue.component('mkl-list-item', require('../temp/list-item.vue'))
    Vue.component('mkl-list', require('../temp/list.vue'))
    Vue.component('mkl-nodes', require('../temp/nodes.vue'))
    Vue.component('mkl-paragraph', require('../temp/paragraph.vue'))
    Vue.component('mkl-quote', require('../temp/quote.vue'))
    Vue.component('mkl-scroll', require('../temp/scroll.vue'))
    Vue.component('mkl-section', require('../temp/section.vue'))
    Vue.component('mkl-separator', require('../temp/separator.vue'))
    Vue.component('mkl-table', require('../temp/table.vue'))
    Vue.component('mkl-usages', require('../temp/usages.vue'))
  },
  embed(element, content = []) {
    if (!_Vue) {
      if (typeof window === 'object' && window && window.Vue) {
        (_Vue = window.Vue).use(Renderer)
      } else {
        throw new Error('No vue constructor was found.')
      }
    }
    if (!ASTNodes) ASTNodes = _Vue.extend(require('../temp/nodes.vue'))
    new ASTNodes({ propsData: { content } }).$mount(element)
  }
}

module.exports = Renderer
