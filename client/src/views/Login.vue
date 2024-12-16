<template lang="pug">
div.login-container
    el-form(autocomplete="on" label-position="left").login-form

        h3.title 請登入

        el-form-item
            el-input(v-model="username" placeholder="StaffID")
                i(slot="prefix" class="el-input__icon el-icon-user")
            el-input(placeholder="Password" v-model="password" show-password)
                i(slot="prefix" class="el-input__icon el-icon-key")

        el-button(:loading="loading" type="primary" @click.native.prevent="handleLogin").push-right 登入

</template>

<script>
import api from "../services/api";
export default {
  data: () => ({
    username: "",
    password: "",
    loading: false
  }),
  methods: {
    async handleLogin() {
      this.loading = true;
      await new Promise(resolve => setTimeout(resolve, 500));
      try {
        let result = await api.login(this.username, this.password);
        this.loading = false;
        if (!result) {
          this.$message.error("Staff ID or password error!");
        } else {
          this.$router.push("Cart");
        }
      } catch (error) {
        this.loading = false;
      }
    }
  }
};
</script>

<style lang="stylus" scoped>
.login-container
    position absolute
    top 0
    left 0
    right 0
    bottom 0
    display flex
    flex-direction column
    justify-content center

    .login-form
        margin 0 auto

    .el-input
        display inline-block
        height 47px
        width 100%

    .push-right
        float right
</style>
