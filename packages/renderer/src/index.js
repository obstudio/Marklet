const HeadingComponent = require('@/heading.vue')
const InlinelistComponent = require('@/inlinelist.vue')
const NodesComponent = require('@/nodes.vue')
const ParagraphComponent = require('@/paragraph.vue')
const QuoteComponent = require('@/quote.vue')
const SeparatorComponent = require('@/separator.vue')
const UsagesComponent = require('@/usages.vue')

let _Vue = null, ASTNodes = null

const Renderer = {
  install(Vue) {
    _Vue = Vue
    Vue.component('ml-heading', HeadingComponent)
    Vue.component('ml-inlinelist', InlinelistComponent)
    Vue.component('ml-nodes', NodesComponent)
    Vue.component('ml-paragraph', ParagraphComponent)
    Vue.component('ml-quote', QuoteComponent)
    Vue.component('ml-separator', SeparatorComponent)
    Vue.component('ml-usages', UsagesComponent)
  },
  embed(element, content = []) {
    if (!_Vue) {
      if (typeof window === 'object' && window && window.Vue) {
        (_Vue = window.Vue).use(Renderer)
      } else {
        throw new Error('No vue constructor was found.')
      }
    }
    if (!ASTNodes) ASTNodes = _Vue.extend(NodesComponent)
    new ASTNodes({ propsData: { content } }).$mount(element)
  }
}

module.exports = Renderer
