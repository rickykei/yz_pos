<template lang="pug">
  div.pos
    el-row
      //- left part of the screen
      el-col(:span="17")
        //- search bar
        div.often-goods
          div.title 常用商品
            el-autocomplete(popper-class="popper"
                       :fetch-suggestions="getGoodsSuggestion" 
                       @select="onSelect"
                       placeholder="goods Id" v-model="goodsId").margin-left-10px
              template(slot-scope="{ item }")
                div(class="name")
                  b {{item.value}} 
                  | {{item.goodsName}} (${{parseFloat(item.market_price).toFixed(2)}})
            el-button.margin-left-10px 查找
            el-button(@click="clear").margin-left-10px 取消
        div.banner
          div.title C=皇冠, D=鑽石&德萊板, F=富美家, G=西德板, H=雅美家, P=保麗雅, S=松耐特, T=德利板, V=雅高 
        //- stack tab bar
        div.goods-type

          div.lv1
            span(v-for="cat in tabData" :key="cat_id" :class="{active:cat.cat_id==current_l1.cat_id}")
              a(href="#" @click="onLevel1Change(cat)") {{cat.cat_name}}
                //- level 2
                
          div.lv2
            span(v-for="child_cat in current_l1.child_cats" :key="cat_id" :class="{active:child_cat.cat_id==current_l2.cat_id}")
              a(href="#" @click="onLevel2Click(child_cat)") {{child_cat.cat_name}}

                //- level child node
          ul.cookList
            li(v-for="goods in current_l2.goods_list" :key="goodsId" @click="addOrderList(goods)" )
              div(class="food-content"  :class="{deactive:goods.pos_display=='N'}")
                span.food-name {{goods.goodsName}} 
                  i: b ({{goods.goodsId}})
                span.food-price ${{parseFloat(goods.market_price||0).toFixed(2)}}元

      el-col(:span="7").pos-order
        //- cart box
        el-tabs(v-model="activeName")
          el-tab-pane(label="出售" name="orderIng")
            el-table(:data="tableData"  :header-cell-style="tableHeaderColor" :cell-style="cellStyle" border)

              el-table-column(:render-header="renderHeader" width="40" )
                template(slot-scope="scope")
                  el-checkbox(v-model="scope.row.selected")

              el-table-column(prop="goodsName" label="商品名" )

              el-table-column(label="數量" width="122" )
                template(slot-scope="scope")
                  el-input-number(v-model="scope.row.qty" size="small" @change="(e)=>{onNumberChanged(e,scope.row)}")
              
              el-table-column(label="金额" width="70" )
                template(slot-scope="scope")
                  span {{scope.row.market_price}}
        
        //- cart summarized
        div.foot-statistical
            span
              small 数量：
              | {{totalCount}}
            span  
              small 金額：
              | ${{parseFloat(totalMoney).toFixed(2)}}元
                
        //- cart actions
        div.foot-btn
            el-button(type="danger" @click="delSelectedGoods") 删除
            el-button(type="success" @click="checkout") 結賬

</template>

<script>
import api from "../services/api";
import storage from "../services/storage";

export default {
  name: "cart",

  data: () => ({
    l1_cat: "",
    l2_cat: "",
    current_l1: {},
    current_l2: {},
    tabData: [],
    goodsId: "",
    activeName: "orderIng",
    tableData: [],
    allData: [],
    totalCount: 0,
    totalMoney: 0
  }),
  watch: {
    goodsId(value) {
      this.onSearchGoods(value);
    },
    tabData() {
      this.onLevel1Change(this.tabData[0]);
    }
  },
  methods: {
    getGoodsSuggestion(code, cb) {
      let items = [];
      if (code == "") return cb(items);
      let tabData = JSON.parse(JSON.stringify(this.allData));
      for (const cat of tabData) {
        for (const child_cat of cat.child_cats) {
          const _items = child_cat.goods_list
            .filter(e => !!e.goodsId.match(new RegExp("^" + code, "i")))
            .map(e => ({ value: e.goodsId, ...e }));
          items = items.concat(_items);
        }
      }
      if (items.length == 1) return cb([]);
      cb(items);
    },
    clear() {
      this.goodsId = "";
      this.onSearchGoods("");
    },
    renderHeader(h) {
      return h("el-checkbox", {
        on: {
          change: $event => this.tableData.map(e => (e.selected = $event))
        },
        props: {
          boder: true,
          size: "medium"
        }
      });
    },
    onSearchGoods(value) {
      let tabData = JSON.parse(JSON.stringify(this.allData));
      for (const cat of tabData) {
        for (const child_cat of cat.child_cats) {
          child_cat.goods_list =
            child_cat.goods_list == "" ? [] : child_cat.goods_list;
          child_cat.goods_list = child_cat.goods_list.filter(
            e => !!e.goodsId.match(new RegExp("^" + value, "i"))
          );
        }
        cat.child_cats = cat.child_cats.filter(e => e.goods_list.length > 0);
      }
      tabData = tabData.filter(e => e.child_cats.length > 0);
      if (tabData.length > 0) {
        this.l1_cat = "0";
        this.l2_cat = "0";
      }
      this.tabData = tabData;
      this.current_l2 = this.tabData[0].child_cats[0];
    },
    onNumberChanged(value, row) {
      setTimeout(() => {
        if (value <= 0) {
          this.tableData = this.tableData.filter(o => o.goodsId != row.goodsId);
        }
        this.getAllMoney();
      }, 1);
    },
    // 点击右边商品，添加到左边
    addOrderList(goods) {
      if (goods.pos_display == "N") {
        return false;
      }

      // 每次添加都清零，防止重复添加
      this.totalCount = 0;
      this.totalMoney = 0;
      // 定义isHave判断这个商品是否已经存在于订单列表
      let isHave = false;
      // tableData循环
      for (let i = 0; i < this.tableData.length; i++) {
        // console.log(this.tableData[i].goodsId);
        if (this.tableData[i].goodsId == goods.goodsId) {
          isHave = true;
        }
      }

      //限制16件輸入貨品
      if (this.tableData.length == 16) {
        return false;
      }

      // 根据判断的值写业务逻辑
      if (isHave) {
        // 改变列表中的商品数量
        // 通过filter过滤tableData
        let arr = this.tableData.filter(o => o.goodsId == goods.goodsId);
        arr[0].qty++;
      } else {
        // 构造一个newGoods
        let newGoods = {
          goodsId: goods.goodsId,
          goodsName: goods.goodsName,
          market_price: goods.market_price,
          qty: 1,
          selected: false
        };
        this.tableData.push(newGoods);
      }
      this.getAllMoney();
    },
    delSelectedGoods() {
      this.tableData = this.tableData.filter(o => !o.selected);
      this.getAllMoney();
    },
    // 删除单个商品
    delSingleGoods(goods) {
      // console.log(goods);
      this.tableData = this.tableData.filter(o => o.goodsId != goods.goodsId);
      this.getAllMoney();
    },
    // 删除所有商品
    delAllGoods() {
      this.tableData = [];
      this.totalCount = 0;
      this.totalMoney = 0;
    },
    // 因为删除，增加后都要重新汇总，所以汇总方法要复用
    getAllMoney() {
      this.totalCount = 0;
      this.totalMoney = 0;
      // 订单列表有数据的时候才进行汇总
      if (this.tableData) {
        // 进行数量和价格的汇总计算
        // element表示tableData中的单个元素
        this.tableData.forEach(element => {
          this.totalCount += element.qty;
          this.totalMoney =
            this.totalMoney + element.market_price * element.qty;
        });
      }
    },
    // 结账
    checkout() {
      api.saveGoods(this.tableData);
    },
    //
    onLevel2Click(child_cat) {
      this.current_l2 = child_cat;
    },
    //
    onLevel1Change(cat) {
      this.current_l1 = cat;
      const l1_cat = this.tabData[cat.cat_name];
      if (l1_cat && l1_cat.child_cats[0]) {
        this.current_l2 = l1_cat.child_cats[0];
      }
    },
    // 修改table header的背景色
    tableHeaderColor({ rowIndex }) {
      if (rowIndex === 0) {
        return 'background-color: green;color: #fff;font-weight: 500;'
      } 
    },
    cellStyle({ rowIndex }){ 
        // console.log(row);
        // console.log(row.column);
        if (rowIndex % 2 !== 0)
          return 'background: lightblue'
        else
          return 'background: lightblue '
    }
  },
  async mounted() {
    const all_cats = await api.getGoodsCats();
    // deep copy the data
    this.allData = JSON.parse(JSON.stringify(all_cats));
    this.tabData = all_cats;
    this.tableData = storage.getItem(storage.KEY.CART_DATA) || [];
    this.current_l1 = this.tabData["木板"];
    this.current_l2 = this.tabData[0].child_cats[0];
  }
};
</script>

<style lang="stylus">
.popper
  width 380px !important
  .name
    float right

.row-color
       background #f0f9eb 
       
</style>

<style lang="stylus" scoped>

.nobreak
  white-space nowrap

.margin-left-10px
  margin-left 10px

.pos
  position absolute
  top 0
  right 0
  left 0
  bottom 0
  background #DAF3B5

  .often-goods
    .title
      height 38px
      line-height 30px
      font-size 14px
      border-bottom 1px solid #D3DCE6
      background-color #F9FAFC
      padding 10px
      .el-input
        padding-left 10px
        width 300px !important

  .banner
    .title
      height 38px
      line-height 30px
      font-size 14px
      border-bottom 1px solid #D3DCE6
      background-color #F9FAFC
      padding 10px

  div.lv1
    span
      background #d6fff8
      text-align center
      display inline-block
      min-width 100px
      line-height 40px
      border-bottom 2px solid #E4E7ED
      &.active
        transition transform .3s cubic-bezier(.645,.045,.355,1),-webkit-transform .3s cubic-bezier(.645,.045,.355,1);
        color #409EFF
        border-bottom 2px solid #409EFF
        a
          color #409EFF
      a
        text-decoration none
        color black
        &:hover
          color #409EFF

  div.lv2
    span
      background #d6f8ff
      text-align center
      display inline-block
      min-width 100px
      line-height 40px
      border-bottom 2px solid #E4E7ED
      &.active
        transition transform .3s cubic-bezier(.645,.045,.355,1),-webkit-transform .3s cubic-bezier(.645,.045,.355,1);
        color #409EFF
        border-bottom 2px solid #409EFF
        a
          color #409EFF
      a
        text-decoration none
        color black
        &:hover
          color #409EFF




  .goods-type
    padding: 10px

    .cookList li
      list-style: none;
      width:23%;
      border:1px solid #E5E9F2;
      height: auto;
      overflow: hidden;
      background-color:#fff;
      padding: 2px;
      float:left;
      margin: 2px;
      cursor: pointer


      span
        display block
        float left

      .food-content
        height 85px
        background #B5EFF3

      .food-name
          font-size 16px
          padding-left 10px
          color brown
          width 100%

      .food-price
          font-size 16px
          padding-left 10px
          padding-top 10px

      .deactive
        background #dddddd

  .pos-order
    padding 10px
    border-right 1px solid #e7e7e7
    overflow auto
     
    .el-input-number
       width 100px !important

    .foot-statistical
      padding: 10px;
      text-align: center;
      background: #ffe;
      border: 1px solid #e7e7e7;
      border-top: none;
      span
        margin: 0 10px;
        font-size: 16px
      span
        small
          font-size: 12px

    .foot-btn
      padding: 10px;
      text-align: center


       
</style>
