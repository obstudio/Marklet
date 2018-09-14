const { DocLexer } = require('markletjs')

module.exports = {
  _Vue: null,
  install(Vue) {
    Vue.component('heading', require('@/heading.vue'))
    Vue.component('inlinelist', require('@/inlinelist.vue'))
    Vue.component('nodes', require('@/nodes.vue'))
    Vue.component('paragraph', require('@/paragraph.vue'))
    Vue.component('quote', require('@/quote.vue'))
    Vue.component('separator', require('@/separator.vue'))
    Vue.component('usages', require('@/usages.vue'))
    this._Vue = Vue
  },
  parse(source, config) {
    return new DocLexer(config).parse(source)
  },
  embed(source, el, config) {
    const element = typeof el === 'string' ? document.querySelector(el) : el
    const Vue = this._Vue
    if (!element) {
      throw new Error('Specified element not exists.')
    } else if (!Vue) {
      throw new Error('The renderer is a vue plugin. It should be installed before using.')
    } else {
      return new Vue({
        el: element,
        data: this.parse(source, config),
        render(h) {
          return h('nodes', { props: { content: this.$data } })
        }
      })
    }
  }
}
