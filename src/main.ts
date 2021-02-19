import Vue from "vue";
import App from "./App.vue";
import router from "./router";

Vue.config.productionTip = false;

import composition from '@vue/composition-api'

Vue.use(composition)

new Vue({
  router,
  render: h => h(App)
}).$mount("#app");
