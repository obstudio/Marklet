Vue.component('heading', require('../dist/heading.vue'))
Vue.component('nodes', require('../dist/nodes.vue'))
Vue.component('paragraph', require('../dist/paragraph.vue'))
Vue.component('quote', require('../dist/quote.vue'))
Vue.component('separator', require('../dist/separator.vue'))
Vue.component('usages', require('../dist/usages.vue'))

const { DocLexer } = require('../dist/Document')

window.marklet = {
  comp: {
    watch: require('../dist/watch.vue'),
    edit: require('../dist/edit.vue'),
  },
  parse(source, config) {
    return new DocLexer(config).parse(source)
  },
  start(type) {
    new Vue(this.comp[type]).$mount('#app')
    document.title = 'Marklet - ' + type
  },
}
