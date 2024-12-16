<template lang="pug">
  div
    div.table-top
      
    table.table-order-header
      thead
        td(width="100") 發票日期：
        td(width="165"): el-input(v-model="formData.invoice_date" size="small" readonly)
        td(width="120") 營業員 ：
        td(width="130") 
          el-select( v-model="formData.sales" placeholder="请选择" size="small" @change="forceRefresh")
            el-option(v-for="item in sales_options" :key="item.id" :label="item.name" :value="item.name")
        td(colspan="3")
          el-radio-group(v-model="formData.status").line-height-30px
            el-radio(v-for="item in status_options" :key="item.value" :label="item.value" @change="forceRefresh")  {{item.label}}
          br 
          el-radio-group(v-model="formData.delivery")
            el-radio(v-for="item in delivery_options" :key="item.value" :label="item.value" @change="forceRefresh") {{item.label}}

      tr
        td 送貨日期:
        td: el-date-picker( v-model="delivery_date" :editable="false" type="date" placeholder="选择日期" size="small")
        td: i.el-icon-s-custom
          | 客戶編號：
        td(colspan="1"): el-input(v-model="formData.mem_id" placeholder="请输入編號"  prefix-icon="el-icon-search" size="small" @input="forceRefresh" @change="onMemIdChange")
        td(width="237") 客戶名稱：
            el-input(v-model="formData.mem_name" size="small"  @input="forceRefresh").medium-input
        td(width="118") 會員級別
          el-input(v-model="formData.mem_credit_level" size="small" readonly).extra-small-input
        td: div.balance
          el-input(v-model="formData.mem_dep_bal" size="small" readonly): template(slot="prepend") 現金結餘 : 
          el-input(v-model="formData.mem_dep_bank_bal" size="small" readonly): template(slot="prepend") 銀行結餘 : 

      tr
        td 送貨時間：
        td(colspan="1") 
          el-select(v-model="formData.delivery_timeslot" placeholder="请选择" size="small" @change="forceRefresh")
            el-option(v-for="item in timeslot_options" :key="item.value" :label="item.label" :value="item.value")
        td(colspan="1") 收貨人：
        td(colspan="1"): el-input(v-model="formData.receiver" size="small").small-input
        td(colspan="3") 姓氏：
          el-input(v-model="formData.lastname" size="small").medium-input

      tr
        td 會員remark：
        td(colspan="6"): el-input(v-model="formData.mem_remark" size="small" @input="forceRefresh")

      tr
        td 入賬日期：
        td: el-date-picker( v-model="settledate" :editable="false" type="datetime" placeholder="选择日期" size="small")
        td: i.el-icon-location 
          | 送貨地址：
        td(colspan="3"): el-input(v-model="formData.mem_add" size="small" @input="forceRefresh")
        td: el-input(v-model="formData.mem_alert" size="small" readonly)


    table.table-goods-list
      thead
        td(width="4%") 行數
        td(width="20%") 貨品編號
        td(width="7%") 數量
        td(width="30%") 項目
        td(width="9%") 單價
        td(width="7%") 折扣%
        td(width="5%").text-align-center 行送
        td(width="6%").text-align-center 界板
        td(width="6%").text-align-center 出貨
          el-checkbox(v-model="delivery_all").margin-left-5px
        td(width="10%") 
      tbody 
        tr(v-for="(item,index) in tableData" :key="item.goodsId")
          td(width="4%") {{index+1}}
          td(width="20%") {{item.goodsId}}
          td: el-input-number(v-model="item.qty" :min="1" size="small" type="number")
          td: el-input(v-model="item.goodsName" size="small")
          td: el-input(v-model="item.market_price" size="small" type="number")
          td: el-input(v-model="item.discount" size="small" type="number")
          td.text-align-center: el-checkbox(v-model="item.deductStock" )
          td.text-align-center: el-checkbox(v-model="item.cutting" )
          td.text-align-center: el-checkbox(v-model="item.delivered" )
          td.text-align-center: el-button(type="warning" icon="el-icon-delete" circle size="small" @click="onItemDelete(item)")

    table.table-order-footer
      thead
        td(width="100%" style="text-align:right;") 
          | 總折扣
          el-input(v-model="formData.subdiscount" size="small"  type="number" @input="forceRefresh").extra-small-input.margin-left-5px
          | &nbsp; % 
          el-input(v-model="formData.subdeduct" size="small"  type="number" @input="forceRefresh").extra-small-input.margin-left-5px
          | &nbsp; $
          | &nbsp;&nbsp;訂金
          el-input(v-model="formData.deposit" size="small" type="number" @input="forceRefresh").small-input.margin-left-5px
          | &nbsp;&nbsp;
          el-button(type="success" @click="calculateTotal") 暫計
          el-input(v-model="formData.count" size="small" readonly).small-input.margin-left-5px
          | &nbsp;&nbsp;信用卡
          el-checkbox(v-model="formData.creditcard" @change="forceRefresh").margin-left-5px
          | &nbsp;&nbsp;&nbsp;&nbsp;
          el-button(type="primary" icon="el-icon-back" @click="backToCart").margin-left-20px POS
          el-button(type="info" @click="onRestore") 清除
          el-button(type="danger" @click="confirmOrder")  送出

</template>

<script>
import storage from "../services/storage";
import api from "../services/api";
import moment from "moment";
import _ from "lodash";
// eslint-disable-next-line no-unused-vars
let _cartData = [];

export default {
  name: "PlaceOrder",
  data: () => ({
    // timepicker can't response to datachange so, need define here
    delivery_date: null,
    settledate: null,
    // --
    delivery_all: true,
    timeslot_options: [
      { value: 1, label: "早 08:00-11:00" },
      { value: 2, label: "午 11:01-14:00" },
      { value: 3, label: "晚 14:01-18:00" }
    ],
    sales_options: [],
    status_options: [
      { value: "A", label: "入賑" },
      { value: "S", label: "掛單" },
      { value: "D", label: "訂金" }
    ],
    deposit_method_options: [
      { value: "C", label: "現金入賑" },
      { value: "D", label: "會員現金扣數" },
      { value: "B", label: "會員銀行扣數" }
    ],
    delivery_options: [
      { value: "Y", label: "送貨" },
      { value: "S", label: "自取" },
      { value: "C", label: "街車即走" },
      { value: "W", label: "等電" }
    ],
    // --
    tableData: [],
    formData: {
      special_man_power_percent: 0,
      delivery: "Y",
      status: "A",
      deposit_method: "C",
      lastname: "",
      receiver: "",
      creditcardrate: 0,
      mem_name: "",
      mem_add: "",
      mem_id: ""
    }
  }),
  methods: {
    backToCart() {
      this.saveFormToStorage();
      this.$router.push("Cart");
    },
    forceRefresh() {
      // polyfill the el-input bug
      this.$forceUpdate();
    },
    confirmOrder() {
      // form validation
      if (!this.formData.delivery_timeslot || !this.delivery_date) {
        this.$message({
          showClose: true,
          message: "Please input delivery date and timeslot",
          type: "error"
        });
        return;
      }

      if (!this.formData.mem_id) {
        this.$message({
          showClose: true,
          message: "Please input member id",
          type: "error"
        });
        return;
      }

      if (this.tableData.length == 0) {
        this.$message({
          showClose: true,
          message: "Please add one goods",
          type: "error"
        });
        return;
      }

      this.calculateTotal();
      this.saveFormToStorage();
      storage.setItem(storage.KEY.CART_DATA, this.tableData);
      this.$router.push("ConfirmOrder");
    },
    async onMemIdChange() {
      const mem = await api.getCustomer(this.formData.mem_id);
      _.assign(this.formData, mem);
      this.$forceUpdate();
      this.saveFormToStorage();
    },
    onItemDelete(item) {
      this.tableData.splice(this.tableData.indexOf(item), 1);
    },
    onRestore() {
      this.tableData = JSON.parse(JSON.stringify(_cartData));
    },
    calculateTotal() {
      let total = 0;
      //1. total price
      this.tableData.map(e => {
        e.deductStock = !!e.deductStock;
        e.cutting = !!e.cutting;
        e.delivered = !!e.delivered;
        const subTotal =
          (parseInt(e.qty || 0) *
            parseFloat(e.market_price || 0) *
            (100 - parseFloat(e.discount || 0))) /
          100;
        total += subTotal;
        e.subtotal = subTotal.toFixed(2);
      });
      this.formData.subtotal = total.toFixed(2);
      this.formData.subdiscount = this.formData.subdiscount || 0;
      this.formData.subdeduct = this.formData.subdeduct || 0;

      // 2. total discount
      total =
        (total * (100 - parseFloat(this.formData.subdiscount))) / 100 -
        parseFloat(this.formData.subdeduct);

      // 3. add credit card fee
      if (this.formData.creditcard) {
        this.formData.creditcardrate = 3;
        this.formData.creditcardtotal = Math.round(
          (total * this.formData.creditcardrate) / 100
        );
        total += this.formData.creditcardtotal;
      } else {
        this.formData.creditcardrate = 0;
        this.formData.creditcardtotal = 0;
      }
      this.formData.count = total.toFixed(2);
      this.formData.remain = this.formData.count - this.formData.deposit;
      this.$forceUpdate();
    },
    saveFormToStorage() {
      if (this.formData.delivery_timeslot) {
        this.formData.delivery_timeslot_label = _.find(this.timeslot_options, {
          value: this.formData.delivery_timeslot
        }).label;
      }

      if (this.formData.sales) {
        const sales = _.find(this.sales_options, { name: this.formData.sales });
        this.formData.pc = sales.pc;
        this.formData.area = sales.area;
      }

      if (this.formData.delivery) {
        const opt = _.find(this.delivery_options, {
          value: this.formData.delivery
        });
        this.formData.delivery_label = opt.label;
      }
      if (this.formData.status) {
        const opt = _.find(this.status_options, {
          value: this.formData.status
        });
        this.formData.status_label = opt.label;
      }

      this.formData.delivery_date = this.delivery_date;
      this.formData.settledate = this.settledate;
      this.formData.deposit = parseFloat(this.formData.deposit || 0).toFixed(2);
      this.formData.subdeduct = parseFloat(
        this.formData.subdeduct || 0
      ).toFixed(2);
      storage.setItem(storage.KEY.FORM_DATA, this.formData);
    },
    saveCartToStorage() {
      storage.setItem(storage.KEY.CART_DATA, this.tableData);
    },
    restoreFormFromStorage() {
      const form = storage.getItem(storage.KEY.FORM_DATA);
      this.delivery_date = form.delivery_date;
      this.settledate = form.settledate;
      _.assign(this.formData, form);
    }
  },
  async mounted() {
    this.sales_options = await api.getStaffs();

    const cartData = storage.getItem(storage.KEY.CART_DATA) || [];
    this.tableData = cartData.map(e => {
      if (e.delivered == undefined) e.delivered = true;
      e.discount = 0;
      e.market_price = parseFloat(e.market_price).toFixed(2);
      return e;
    });

    _cartData = JSON.parse(JSON.stringify(cartData));

    this.formData.invoice_date = moment().format("YYYY-MM-DD HH:mm");
    this.delivery_date = new Date();
    const _time = moment().format("HH:mm");
    if (_time >= "08:00" && _time <= "11:00")
      this.formData.delivery_timeslot = 1;
    if (_time >= "11:01" && _time <= "14:00")
      this.formData.delivery_timeslot = 2;
    if (_time >= "14:01" && _time <= "18:00")
      this.formData.delivery_timeslot = 3;
    this.settledate = new Date();
    this.formData.sales = storage.getItem(storage.KEY.USER_INFO).name;
    this.restoreFormFromStorage();
  },
  watch: {
    delivery_all(n) {
      this.tableData.map(e => {
        e.delivered = n;
      });
    },
    tableData: {
      handler() {
        this.saveCartToStorage();
      },
      deep: true
    }
  }
};
</script>

<style lang="stylus" scoped>

.el-date-editor
  width 165px !important

.el-radio
  color white !important

.balance
  width 218px

.medium-input
  width 150px

.small-input
  width 100px

.extra-small-input
  width 50px

.margin-left-5px
  margin-left 5px

.margin-left-20px
  margin-left 20px

.line-height-30px
  line-height 30px

.text-align-center
  text-align  center

.table-top
    border 0

.table-order-footer
  margin-top 200px


.table-order-header, .table-goods-list, .table-order-footer
    width 100%
    margin-top 10px
    border-top 1px solid #004d80
    border-left 1px solid #004d80
    border-spacing 0
    td
      border-spacing 0
      border-right 1px solid #004d80
      border-bottom 1px solid #004d80
      padding 5px
    thead
      background-color #004d80
      color white
      td
        border-right 1px solid #FFFFFF
      td:last-child
        border-right 1px solid #004d80
    tr:nth-child(even)
      background-color #f0f0f0
</style>
