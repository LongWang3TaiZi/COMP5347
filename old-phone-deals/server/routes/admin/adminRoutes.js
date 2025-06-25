const express = require('express');
const router = express.Router();
const adminUserController = require('../../controllers/admin/adminUserController');
const adminPhoneController = require('../../controllers/admin/adminPhoneController');
const userAuthControllers = require('../../controllers/user/userAuthControllers');
const { isAdmin } = require('../../middlewares/authMiddleware');
const expressjoi = require('@escook/express-joi');
const { loginSchema } = require('../../validator/userLoginValidator');
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });
const adminAuditLogger = require('../../middlewares/adminAuditLogger');
const adminSalesController = require('../../controllers/admin/adminSalesController');

// admin login route (no auth required)
router.post('/login', adminAuditLogger('ADMIN_LOGIN', 'admin'), expressjoi(loginSchema), userAuthControllers.adminLogin);

// admin session check route (no auth required)
router.get('/check-session', userAuthControllers.checkSession);

// apply admin middleware to all admin routes
router.use(isAdmin);

/**
 * @swagger
 * /api/admin/users:
 *   get:
 *     summary: Get all users (only admin)
 *     description: Get all users (only admin)
 *     responses:
 *       200:
 *         description: A list of users
 *       500:
 *         description: Internal server error
 */
router.get('/users', adminAuditLogger('GET_ALL_USERS', 'user'), adminUserController.getUsers);
router.delete('/user/:id', adminAuditLogger('DELETE_USER', 'user'), adminUserController.deleteUser);
router.put('/user/:id', adminAuditLogger('UPDATE_USER', 'user'), adminUserController.updateUser);
router.get('/phones', adminAuditLogger('GET_ALL_PHONES', 'phone'), adminPhoneController.getPhones);
router.get('/phones/brands', adminAuditLogger('GET_AVAILABLE_BRANDS', 'phone'), adminPhoneController.getAvailableBrands)
router.get('/phones/:id', adminAuditLogger('GET_PHONE_DETAILS_BY_ID', 'phone'), adminPhoneController.getPhoneDetailsById)
router.delete('/phones/:id', adminAuditLogger('DELETE_PHONE', 'phone'), adminPhoneController.deletePhoneById)
router.put('/phones/:id', adminAuditLogger('DISABLE_PHONE', 'phone'), adminPhoneController.disablePhoneById)
router.get('/users/:id/reviews', adminAuditLogger('GET_REVIEWS_BY_USER_ID', 'review'), adminUserController.getReviewsByUserId);
router.get('/users/:id/phones', adminAuditLogger('GET_PHONE_BY_SELLER_ID', 'phone'), adminUserController.getPhoneBySellerId);
router.put('/phones/update/:id', adminAuditLogger('UPDATE_PHONE_BY_ID', 'phone'), adminPhoneController.updatePhoneById);
router.post('/phones/upload-image', upload.single('image'), adminAuditLogger('UPLOAD_PHONE_IMAGE', 'phone'), adminPhoneController.uploadImage);
router.get('/reviews', adminAuditLogger('GET_ALL_REVIEWS', 'review'), adminPhoneController.getAllReviews);
router.get('/reviews/search', adminAuditLogger('SEARCH_REVIEWS', 'review'), adminPhoneController.searchReviews);
router.put('/reviews/hide-show', adminAuditLogger('HIDE_OR_SHOW_REVIEW', 'review'), adminPhoneController.hideOrShowReview);
router.get('/orders', adminAuditLogger('GET_ALL_ORDERS', 'order'), adminSalesController.getAllOrders);
router.get('/orders/export', adminAuditLogger('EXPORT_SALES', 'order'), adminSalesController.exportOrders);
module.exports = router;