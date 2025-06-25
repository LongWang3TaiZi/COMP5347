const express = require('express');
const router = express.Router();
const phoneController = require('../controllers/phone/phoneController');

// GET /api/phones/sold-out-soon - Get phones that are about to sell out
router.get('/sold-out-soon', phoneController.getSoldOutSoonPhones);

// GET /api/phones/best-sellers - Get phones with highest average ratings
router.get('/best-sellers', phoneController.getBestSellerPhones);

router.get('/search', phoneController.searchPhones);

router.get('/:id', phoneController.getPhoneById);

router.post('/:id/reviews', phoneController.addReview);

module.exports = router;