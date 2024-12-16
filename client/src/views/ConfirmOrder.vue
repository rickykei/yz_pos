<template lang="pug">
    div
      table.table-order-header
        tr
          td 發票日期：
          td {{formData.invoice_date}}
          td 送貨日期：
          td {{delivery_date}}
        tr
          td
          td
          td 送貨時間：
          td {{formData.delivery_timeslot_label}}
        tr
          td 員工姓名：
          td {{formData.sales}}
          td 送貨：
          td {{formData.delivery_label=="送貨"?"是":formData.delivery_label}}
        tr
          td 客戶名稱：
          td {{formData.mem_name}}
          td 收貨人：
          td {{formData.receiver}}
        tr
          td 
          td 
          td 姓氏：
          td {{formData.lastname}}
        tr
          td 客戶地址：
          td {{formData.mem_add}}
          td 客戶編號：
          td  {{formData.mem_id}}
        tr
          td 入賬日期：
          td {{formData.invoice_date}}
          td 入賑：
          td {{formData.status_label}}

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
          td(width="10%") Subtotal
        tbody 
          tr(v-for="(item,index) in tableData" :key="item.goodsId")
            td(width="4%") {{index+1}}
            td(width="20%") {{item.goodsId}}
            td {{item.qty}}
            td {{item.goodsName}}
            td ${{item.market_price}}
            td {{item.discount}}
            td.text-align-center {{item.deductStock?'Y':'N'}}
            td.text-align-center {{item.cutting?'Y':'N'}}
            td.text-align-center {{item.delivered?'Y':'N'}}
            td.text-align-center ${{item.subtotal}} 
      table.table-order-footer
        thead
          td(width="90%") &nbsp;
          td
        tbody
          tr
            td 合計：
            td ${{formData.subtotal}}
          tr
            td 尾數：
            td ${{formData.remain}}
          tr
            td 總折扣：
            td 減{{formData.subdiscount}}% 減{{formData.subdeduct}}元 
          tr
            td 訂金：
            td ${{formData.deposit}}
          tr
            td 信用卡：
            td ${{formData.creditcardtotal}}.00
          tr
            td 總合計：
            td ${{formData.count}}
          tr
            td
              el-button(type="warning" @click="backToCart") 上一步 
            td
              el-button(type="danger" @click="saveOrder") 提交
</template>

<script>
import storage from "../services/storage";
import api from "../services/api";
import moment from "moment";
export default {
  name: "ConfirmOrder",
  data: () => ({
    tableData: [],
    formData: {}
  }),
  computed: {
    delivery_date() {
      if (this.formData.delivery_date) {
        return moment(this.formData.delivery_date).format("YYYY-MM-DD");
      } else {
        return "";
      }
    }
  },
  methods: {
    backToCart() {
      this.$router.push("PlaceOrder");
    },
    async saveOrder() {
      try {
        const order = await api.saveOrder({
          cart_data: this.tableData,
          form_data: this.formData
        });
        await this.$alert(
          `<strong>Order : <i>${order.order_id}</i> created 
          <br> <a target="_blank" href="${order.pdf_url}">View Pdf</a></strong>`,
          "Order Created",
          {
            dangerouslyUseHTMLString: true
          }
        );
        // clear items and form
        storage.removeItem(storage.KEY.CART_DATA);
        storage.removeItem(storage.KEY.FORM_DATA);
        this.$router.push("Cart");
      } catch (error) {
        this.$message({
          showClose: true,
          message: `Failed to create order:${error.message}`,
          type: "error"
        });
      }
    }
  },
  mounted() {
    this.tableData = storage.getItem(storage.KEY.CART_DATA) || [];
    this.formData = storage.getItem(storage.KEY.FORM_DATA) || {};
  }
};
</script>

<style lang="stylus" scoped>

table td
  padding 5px
.table-order-header
    width 100%
    background-color #004d80
    color white

.table-goods-list
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

.table-order-footer
  width 100%
  border-spacing 0
  thead
    background-color #004d80
    td
      height 10px

  tbody
    tr
      td:first-child
        float right

.push-right
  float right
</style>
