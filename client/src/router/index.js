import Vue from "vue";
import NProgress from "nprogress";
import VueRouter from "vue-router";
import Login from "../views/Login.vue";
import PlaceOrder from "../views/PlaceOrder.vue";
import Cart from "../views/Cart.vue";
import ConfirmOrder from "../views/ConfirmOrder.vue";
import storage from "../services/storage";
Vue.use(VueRouter);

const routes = [
  {
    path: "*",
    component: Login
  },
  {
    path: "/Login",
    name: "Login",
    component: Login
  },
  {
    path: "/Cart",
    name: "Cart",
    component: Cart
  },
  {
    path: "/PlaceOrder",
    name: "PlaceOrder",
    component: PlaceOrder
  },
  {
    path: "/ConfirmOrder",
    name: "ConfirmOrder",
    component: ConfirmOrder
  }
];

const router = new VueRouter({
  // mode: "history", // ricky's server not support this
  mode: "hash",
  base: process.env.BASE_URL,
  routes
});

router.beforeEach((to, from, next) => {
  NProgress.start();
  const pathWhiteList = ["/", "/Login"];
  if (
    pathWhiteList.indexOf(to.path) == -1 &&
    !storage.getItem(storage.KEY.JWT_TOKEN)
  ) {
    return router.push("Login");
  }
  next();
});

router.afterEach(() => {
  NProgress.done();
});

export default router;
