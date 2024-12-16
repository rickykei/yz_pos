
const dao = require("../services/db");
const jwt = require('jsonwebtoken');
const config = require("../config");
const _ = require('lodash');
const rp = require('request-promise');

async function login(req,res){
    const {username,password} = req.body;
    const sql="select id, name, pc, area, role from staff where username=$1 and password=$2"
    const [result] = await dao.query(sql,[username,password]);
    if(result){
        const payload={
            exp:Date.now()+1000*24*3600,
            id:result.id
        }
        const token = jwt.sign(payload,config.JWT_SECRECT);
        res.send({token:token,user:result});
    }else{
        res.send({token:null});
    }
}

async function getGoodsCats(req,res){


	const specialCat = [ '五金', '腳線' , '膠水' , '什項' , '飾板' , '木皮' ];
	 
    let sql="SELECT * FROM type where level in (1,0) and sts='A'  order by seq,id"
    const types = await dao.query(sql);
    sql="select goods_partno,goods_detail,market_price,model,model2,pos_display from sumgoods  where  model3_x is not null and model3_y is not null order by pos_seq ";
    let goods = await dao.query(sql);

    const catData = _.filter(types,{level:0}).map(e=>({
        cat_name:e.typeName,
        cat_id:e.id,
        child_cats:_.filter(types,{level:1,parent_id:e.id}).map(i=>({
            cat_name:i.typeName,
            cat_id:i.id,
            goods_list:_.filter(goods,{model:e.typeName,model2:i.typeName}).map(g=>({
                goodsId:g.goods_partno,
                market_price:g.market_price,
                goodsName:g.goods_detail.replace(/\s/g, ''),
				pos_display:g.pos_display
            }))
        }))
    })
    );

  
    //-- 在这里处理每一个子项，加一个總項
    // LOOP EVERY LEVEL 0 , TIPS: catData.forEach(e=>{....})
        // for each level0 
            //  decale a virtual cat : {cat_name:"總項",cat_id:-999,goods_list:[]}
                // look through all child_cats of this level0, return the goods_list
                // we then got a 2 dimension array
                // flattern this 2 dimemsion array , TIPS: use lodash.flattern()
                // then we got a 1 dimension array of goods_list, set it to above virtal cat
            // push this virtal cat on the top of the level0.child_cats, TIPS: use array.unshirt()

	catData.forEach(c=>{
		 
		if (specialCat.includes(c.cat_name)){
			 
			c.child_cats.unshift({
            cat_name:'總項',
            cat_id:999,
            goods_list:_.filter(goods,{model:c.cat_name}).map(g=>({
                goodsId:g.goods_partno,
                market_price:g.market_price,
                goodsName:g.goods_detail.replace(/\s/g, ''),
				pos_display:g.pos_display
				}))
			})
		}
		 
	});
 

    res.send(catData);
}

async function getStaffs(req,res){
    const sql = "select id,name,pc,area from staff order by 1 desc ";
    const rows = await dao.query(sql);
    return res.send(rows);
}

async function getCustomer(req,res){
    const {mem_id} = req.body;
    let sql = `
    SELECT member_id mem_id,member_add  mem_add,member_tel mem_tel,
    member_name mem_name,creditLevel mem_credit_level,
    (select alert from address addr where mem.member_add like concat('%',addr.address,'%') limit 0,1) mem_alert ,
    remark mem_remark FROM member mem WHERE mem.member_id=$1`
    const [member] = await dao.query(sql,[mem_id]); 
    if(!member) return res.send(null);

    sql="SELECT sum( deposit_amt ) as sum_dep_amt FROM member_deposit WHERE mem_id = $1 ";
    let [{sum_dep_amt}] = await dao.query(sql,[mem_id]);
    sum_dep_amt=sum_dep_amt||0;

    sql="SELECT sum( total_price ) as sum_inv_dep_amt FROM invoice WHERE member_id =$1 and deposit_method='D' and void!='I' "
    let [{sum_inv_dep_amt}] = await dao.query(sql,[mem_id]);
    sum_inv_dep_amt=sum_inv_dep_amt||0;

    sql="SELECT sum( total_price ) as sum_inv_door_dep_amt FROM invoice_door WHERE member_id =$1 and deposit_method='D' and void!='I' "
    let [{sum_inv_door_dep_amt}] = await dao.query(sql,[mem_id]);
    sum_inv_door_dep_amt=sum_inv_door_dep_amt||0;

    sql="SELECT sum(deposit_bank_amt ) as sum_dep_bank_amt FROM member_deposit WHERE mem_id =$1 "
    let [{sum_dep_bank_amt}] = await dao.query(sql,[mem_id]);
    sum_dep_bank_amt=sum_dep_bank_amt||0;
    
    sql="SELECT sum( total_price ) as sum_inv_dep_bank_amt FROM invoice WHERE member_id =$1 and deposit_method='B' and void!='I' "
    let [{sum_inv_dep_bank_amt}] = await dao.query(sql,[mem_id]);
    sum_inv_dep_bank_amt=sum_inv_dep_bank_amt||0;

    sql="SELECT sum( total_price ) as sum_inv_door_dep_bank_amt FROM invoice_door WHERE member_id =$1 and deposit_method='B' and void!='I' ";
    let [{sum_inv_door_dep_bank_amt}] = await dao.query(sql,[mem_id]);
    sum_inv_door_dep_bank_amt=sum_inv_door_dep_bank_amt||0;

    res.send({
        ...member,
        sum_dep_amt,
        sum_inv_dep_amt,
        mem_dep_bal:sum_dep_amt-sum_inv_dep_amt-sum_inv_door_dep_amt,
        mem_dep_bank_bal:sum_dep_bank_amt-sum_inv_dep_bank_amt-sum_inv_door_dep_bank_amt
    })
}

async function saveOrder(req,res){
    const resp = await rp.post(config.PHP_BACKEND+'/?page=api&subpage=set_invoice.php',{json:true,body:req.body})
    console.log(resp);
    res.send(resp.data);
}

module.exports = {
    login,
    getGoodsCats,
    getStaffs,
    getCustomer,
    saveOrder
}