let ASTNodes = null

const HeadingComponent = require('@/heading.vue')
const InlinelistComponent = require('@/inlinelist.vue')
const NodesComponent = require('@/nodes.vue')
const ParagraphComponent = require('@/paragraph.vue')
const QuoteComponent = require('@/quote.vue')
const SeparatorComponent = require('@/separator.vue')
const UsagesComponent = require('@/usages.vue')

module.exports = {
  install(Vue) {
    Vue.component('heading', HeadingComponent)
    Vue.component('inlinelist', InlinelistComponent)
    Vue.component('nodes', NodesComponent)
    Vue.component('paragraph', ParagraphComponent)
    Vue.component('quote', QuoteComponent)
    Vue.component('separator', SeparatorComponent)
    Vue.component('usages', UsagesComponent)
    ASTNodes = Vue.extend(NodesComponent)
  },
  embed(element, content) {
    if (!ASTNodes) {
      if (window && typeof window === 'object' && window.Vue) {
        ASTNodes = window.Vue.extend(NodesComponent)
      } else {
        throw new Error('No vue constructor was found.')
      }
    }
    return new ASTNodes({
      propsData: { content }
    }).$mount(element)
  }
}
