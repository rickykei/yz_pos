const dao = require('../services/db');

async function testUser(){
    const sql="select * from staff where username=$1 and password=$2"
    const result = await dao.query(sql,['fung','90973210']);
    console.log(result);
}

testUser();
