const api  = require('../controllers/api');

const res = {
    send:console.dir
}
function testLogin(){
    api.login({body:{username:'fung',password:'90973210'}},res);
}

function testGetGoodsCats(){
    api.getGoodsCats({},res);   
}

function testGetCustomer(){
    api.getCustomer({body:{mem_id:0}},res);   
}

// testLogin();
// testGetGoodsCats();
testGetCustomer();