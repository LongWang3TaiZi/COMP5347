const express = require('express');
const orderController = require('../../controllers/order/orderController');
const { isAuthenticated, isAdmin } = require('../../middlewares/authMiddleware');

const router = express.Router({ mergeParams: true });

/**
 * @route   GET /api/admin/orders
 * @desc    Get all orders with pagination and filtering
 * @access  Private (Admin only)
 */
router.get('/admin/orders', isAuthenticated, isAdmin, orderController.getAllOrders);

/**
 * @route   GET /api/admin/orders/:orderId
 * @desc    Get order by ID
 * @access  Private (Admin only)
 */
router.get('/admin/orders/:orderId', isAuthenticated, isAdmin, orderController.getOrderById);

/**
 * @route   GET /api/users/:userId/orders
 * @desc    Get orders for a specific user
 * @access  Private (User or Admin)
 */
router.get('/users/:userId/orders', isAuthenticated, orderController.getUserOrders);

/**
 * @route   PATCH /api/admin/orders/:orderId/status
 * @desc    Update order status
 * @access  Private (Admin only)
 */
router.patch('/admin/orders/:orderId/status', isAuthenticated, isAdmin, orderController.updateOrderStatus);

module.exports = router; 