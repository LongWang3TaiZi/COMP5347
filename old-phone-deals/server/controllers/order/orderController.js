const Order = require('../../models/order');
const logger = require('../../config/logger');
const { success, error } = require('../../utils/responseHelper');

/**
 * Get all orders with pagination and filtering
 * @route   GET /api/admin/orders
 * @access  Private (Admin only)
 */
exports.getAllOrders = async (req, res, next) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const status = req.query.status;
        const startDate = req.query.startDate;
        const endDate = req.query.endDate;

        // Build query
        const query = {};
        if (status) query.status = status;
        if (startDate || endDate) {
            query.createdAt = {};
            if (startDate) query.createdAt.$gte = new Date(startDate);
            if (endDate) query.createdAt.$lte = new Date(endDate);
        }

        // Execute query with pagination
        const orders = await Order.find(query)
            .populate('user', 'firstname lastname email')
            .populate('items.phone', 'title brand price')
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit);

        // Get total count for pagination
        const total = await Order.countDocuments(query);

        return res.status(200).json(success({
            orders,
            pagination: {
                total,
                page,
                pages: Math.ceil(total / limit)
            }
        }));
    } catch (err) {
        logger.error('Error in getAllOrders:', err);
        next(err);
    }
};

/**
 * Get order by ID
 * @route   GET /api/admin/orders/:orderId
 * @access  Private (Admin only)
 */
exports.getOrderById = async (req, res, next) => {
    try {
        const order = await Order.findById(req.params.orderId)
            .populate('user', 'firstname lastname email')
            .populate('items.phone', 'title brand price');

        if (!order) {
            return res.status(404).json(error('Order not found'));
        }

        return res.status(200).json(success(order));
    } catch (err) {
        logger.error('Error in getOrderById:', err);
        next(err);
    }
};

/**
 * Get orders for a specific user
 * @route   GET /api/users/:userId/orders
 * @access  Private (User or Admin)
 */
exports.getUserOrders = async (req, res, next) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;

        const orders = await Order.find({ user: req.params.userId })
            .populate('items.phone', 'title brand price')
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit);

        const total = await Order.countDocuments({ user: req.params.userId });

        return res.status(200).json(success({
            orders,
            pagination: {
                total,
                page,
                pages: Math.ceil(total / limit)
            }
        }));
    } catch (err) {
        logger.error('Error in getUserOrders:', err);
        next(err);
    }
};

/**
 * Update order status
 * @route   PATCH /api/admin/orders/:orderId/status
 * @access  Private (Admin only)
 */
exports.updateOrderStatus = async (req, res, next) => {
    try {
        const { status } = req.body;
        
        if (!['pending', 'completed', 'cancelled'].includes(status)) {
            return res.status(400).json(error('Invalid status'));
        }

        const order = await Order.findByIdAndUpdate(
            req.params.orderId,
            { status },
            { new: true }
        );

        if (!order) {
            return res.status(404).json(error('Order not found'));
        }

        return res.status(200).json(success(order));
    } catch (err) {
        logger.error('Error in updateOrderStatus:', err);
        next(err);
    }
}; 