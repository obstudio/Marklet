Vue.component('heading', require('./heading.vue'))
Vue.component('usages', require('./usages.vue'))

new Vue(require('../dist/app.vue')).$mount('#app')
