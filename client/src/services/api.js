import axios from "axios";
import router from "../router";
import storage from "./storage";
import NProgress from "nprogress";

const _axios = axios.create({
  baseURL: "/api/",
  timeout: 5000
});

_axios.interceptors.request.use(
  function(config) {
    config.headers.Authorization = `Bearer ${storage.getItem(
      storage.KEY.JWT_TOKEN
    )}`;
    NProgress.start();
    return config;
  },
  function(error) {
    NProgress.done();
    return error;
  }
);

_axios.interceptors.response.use(
  function(response) {
    NProgress.done();
    return response;
  },
  function(error) {
    NProgress.done();

    if (error.code == "ECONNABORTED") {
      vue.$message({
        showClose: true,
        message: "Backend server timeout in 5 seconds",
        type: "error",
        duration: 5000
      });
      return;
    }

    if (error.response.status >= 500) {
      vue.$message({
        showClose: true,
        message: "Backend server error, code:" + error.response.status,
        type: "error",
        duration: 5000
      });
      return;
    }

    if (error.response.status == 400) return router.push("Login");
  }
);

let vue = null;

export default {
  setVM(_vm) {
    vue = _vm;
  },
  async login(username, password) {
    const resp = await _axios.post("/login", { username, password });
    const { token, user } = resp.data;
    if (!token) return false;
    storage.setItem(storage.KEY.JWT_TOKEN, token);
    storage.setItem(storage.KEY.USER_INFO, user);
    _axios.defaults.headers.common.Authorization = `Bearer ${token}`;
    return true;
  },

  async getGoodsCats() {
    const resp = await _axios.get("/getGoodsCats");
    return resp.data;
  },

  async getStaffs() {
    const resp = await _axios.get("/getStaffs");
    return resp.data;
  },

  async saveGoods(goods) {
    storage.setItem(storage.KEY.CART_DATA, goods);
    router.push("PlaceOrder");
  },

  async getCustomer(mem_id) {
    const resp = await _axios.post("/getCustomer", { mem_id });
    return resp.data;
  },

  async saveOrder(order) {
    const resp = await _axios.post("/saveOrder", order);
    return resp.data;
  }
};
