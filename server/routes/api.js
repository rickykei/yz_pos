const express =   require('express');
const router = express.Router();

const ctrl  = require('../controllers/api');

router.all('/login',ctrl.login);
router.all('/getGoodsCats',ctrl.getGoodsCats);
router.all('/getStaffs',ctrl.getStaffs);
router.all('/getCustomer',ctrl.getCustomer);
router.all('/saveOrder',ctrl.saveOrder);


module.exports  =router;