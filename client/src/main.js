import Vue from "vue";
import App from "./App.vue";
import router from "./router";
import "./plugins/element.js";
import "nprogress/nprogress.css";
import api from "./services/api";

Vue.config.productionTip = false;

const vm = new Vue({
  router,
  render: h => h(App)
}).$mount("#app");

api.setVM(vm);
