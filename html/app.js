Vue.component('heading', require('../dist/heading.vue'))
Vue.component('quote', require('../dist/quote.vue'))
Vue.component('separator', require('../dist/separator.vue'))
Vue.component('usages', require('../dist/usages.vue'))

new Vue(require('../dist/app.vue')).$mount('#app')
