const config = require('../config');
const jwt =  require('jsonwebtoken');

const whiteListPath=['/login']
module.exports=function(req,res,next){

    // await new Promise(resolve=>setTimeout(resolve,1000));

    if(whiteListPath.indexOf(req.path)>-1) return next();
    const {authorization} = req.headers;
    if(!authorization) return res.status(400).end();
    const [,token] = authorization.split(' ');
    try {
        jwt.verify(token,config.JWT_SECRECT);    
        next();  
    } catch (error) {
        res.status(400).end();
    }
}