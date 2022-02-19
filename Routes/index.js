const express = require('express')
const router = express.Router();

const paymentController = require('../Controllers/payments')


router.post('/payment', paymentController.payments)
router.post('/callback', paymentController.callback)
module.exports = router;