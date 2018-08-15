Vue.component('heading', require('../dist/heading.vue'))
Vue.component('paragraph', require('../dist/paragraph.vue'))
Vue.component('quote', require('../dist/quote.vue'))
Vue.component('separator', require('../dist/separator.vue'))
Vue.component('usages', require('../dist/usages.vue'))

const { DocLexer } = require('../dist/Document')

window.marklet = {
  vm: new Vue(require('../dist/app.vue')),
  parse(source, config) {
    return new DocLexer(config).parse(source)
  }
}
