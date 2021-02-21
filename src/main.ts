import Vue from 'vue'
import App from './App.vue'
import router from './router'
import { BootstrapVue, IconsPlugin } from 'bootstrap-vue'
import VueMeta from 'vue-meta'

import './App.scss'

Vue.config.productionTip = false

import composition from '@vue/composition-api'

Vue.use(composition)
Vue.use(BootstrapVue)
Vue.use(IconsPlugin)
Vue.use(VueMeta)

new Vue({
  router,
  render: h => h(App),
}).$mount('#app')
