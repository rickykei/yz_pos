export default {
  getItem(key) {
    const str = window.sessionStorage.getItem(key);
    return JSON.parse(str);
  },
  setItem(key, obj) {
    window.sessionStorage.setItem(key, JSON.stringify(obj));
  },
  removeItem(key) {
    window.sessionStorage.removeItem(key);
  },
  KEY: {
    JWT_TOKEN: "JWT_TOKEN",
    CART_DATA: "CART_DATA",
    FORM_DATA: "FORM_DATA",
    USER_INFO: "USER_INFO"
  }
};
