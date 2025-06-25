const express = require('express');
const customerController = require('./../controllers/customerController');
const { protectRoute } = require('../middlewares/protectRoute');
const { restrictTo } = require('../middlewares/restrictTo');

const router = express.Router();

router.use(protectRoute);
router.use(restrictTo('customer'));

router
  .route('/')
  .post(customerController.createDefaultAddress)
  .get(customerController.getAllCustomerAddresses);

router
  .patch('/default-address', customerController.updateDefaultAddress);

router
  .post('/other-address', customerController.addOtherAddress);

router
  .patch('/other-address/:index', customerController.updateOtherAddress);

router
  .delete('/other-address/:index', customerController.deleteOtherAddress);

module.exports = router;