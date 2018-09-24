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
    Vue.component('heading', HeadingComponent)
    Vue.component('inlinelist', InlinelistComponent)
    Vue.component('nodes', NodesComponent)
    Vue.component('paragraph', ParagraphComponent)
    Vue.component('quote', QuoteComponent)
    Vue.component('separator', SeparatorComponent)
    Vue.component('usages', UsagesComponent)
  },
  embed(element, content) {
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
