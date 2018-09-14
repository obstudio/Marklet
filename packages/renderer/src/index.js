const { DocLexer } = require('markletjs')

module.exports = {
  _Vue: null,
  install(Vue) {
    Vue.component('heading', require('../dist/heading.vue'))
    Vue.component('inlinelist', require('../dist/inlinelist.vue'))
    Vue.component('nodes', require('../dist/nodes.vue'))
    Vue.component('paragraph', require('../dist/paragraph.vue'))
    Vue.component('quote', require('../dist/quote.vue'))
    Vue.component('separator', require('../dist/separator.vue'))
    Vue.component('usages', require('../dist/usages.vue'))
    this._Vue = Vue
  },
  parse(source, config) {
    return new DocLexer(config).parse(source)
  },
  embed(source, el, config) {
    const element = typeof el === 'string' ? document.querySelector(el) : el
    if (!element) {
      throw new Error('Specified element not exists.')
    } else if (!this._Vue) {
      throw new Error('The renderer is a vue plugin. It should be installed before using.')
    } else {
      const Vue = this._Vue
      return new Vue({
        el: element,
        data: this.parse(source, config),
        render(h) {
          return h('nodes', {props: this.$data})
        }
      })
    }
  }
}
