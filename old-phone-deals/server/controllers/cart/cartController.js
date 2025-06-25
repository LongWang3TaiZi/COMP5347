const cartService = require('../../service/cart/cartService');
const { success } = require('../../utils/responseHelper');
const logger = require('../../config/logger');
const mongoose = require('mongoose');

/**
 * @description Retrieves the shopping cart for a specific user (owner or admin access).
 * @route       GET /api/users/:userId/cart
 * @access      Private (Requires Authentication & Authorization)
 * @param {object} req - Express request object. Expects `req.params.userId` and `req.session.user`.
 * @param {object} res - Express response object.
 * @param {function} next - Express next middleware function.
 */
exports.getCart = async (req, res, next) => {
    try {
        // Get target user ID from URL parameters
        const targetUserId = req.params.userId;
        // Get logged-in user info from session (for logging or potential future fine-grained permissions)
        const loggedInUser = req.session.user;

        // Authorization check is handled by the isOwnerOrAdmin middleware, proceed to call the service
        logger.info(`Controller: User ${loggedInUser?._id} requesting cart for user ${targetUserId}`);

        // Call the service, passing the target user's ID
        const cart = await cartService.getCartByUserId(targetUserId);
        logger.info(`Controller: Successfully retrieved cart for user ${targetUserId}`);

        // Return success response
        return res.status(200).json(success({ cart }, 'Cart retrieved successfully.'));

    } catch (err) {
        // Pass error to the errorHandler
        logger.error(`Controller: Error in getCart for target user ${req.params?.userId}, requester ${req.session?.user?._id}: ${err.message}`);
        next(err);
    }
};

/**
 * @description Updates the quantity of an item in a specific user's cart (owner or admin access).
 * @route       PUT /api/users/:userId/cart/:phoneId
 * @access      Private (Requires Authentication & Authorization)
 * @param {object} req - Express request object. Expects `req.params.userId`, `req.params.phoneId`, `req.body.quantity`, `req.session.user`.
 * @param {object} res - Express response object.
 * @param {function} next - Express next middleware function.
 */
exports.updateCartItemQuantity = async (req, res, next) => {
    try {
        // Get target user ID and phone ID from URL parameters
        const targetUserId = req.params.userId;
        const { phoneId } = req.params;
        // Get quantity from request body
        const { quantity } = req.body;
        // Get logged-in user info from session (for logging)
        const loggedInUser = req.session.user;

        // --- Input Validation ---
        if (!mongoose.Types.ObjectId.isValid(targetUserId)) {
             const err = new Error(`Invalid userId format in URL: ${targetUserId}`);
             err.statusCode = 400;
             return next(err);
        }
        if (!mongoose.Types.ObjectId.isValid(phoneId)) {
            const err = new Error(`Invalid phoneId format: ${phoneId}`);
            err.statusCode = 400;
            return next(err);
        }
        const quantityNum = parseInt(quantity, 10);
        if (isNaN(quantityNum) || quantityNum < 0) {
            const err = new Error('Quantity must be a non-negative integer.');
            err.statusCode = 400;
            return next(err);
        }
        // ---------------

        // Authorization check is handled by the isOwnerOrAdmin middleware
        logger.info(`Controller: User ${loggedInUser?._id} updating cart for user ${targetUserId}, phone ${phoneId}, quantity ${quantityNum}`);

        // Call the service, passing target user ID, phone ID, and quantity
        const updatedCart = await cartService.addOrUpdateItem(targetUserId, phoneId, quantityNum);
        logger.info(`Controller: Cart updated successfully for user ${targetUserId}`);

        // Return success response
        return res.status(200).json(success({ cart: updatedCart }, 'Cart updated successfully.'));

    } catch (err) {
        // Pass error to the errorHandler
        logger.error(`Controller: Error in updateCartItemQuantity for target user ${req.params?.userId}, phone ${req.params?.phoneId}, requester ${req.session?.user?._id}: ${err.message}`);
        next(err);
    }
};

/**
 * @description Removes an item from a specific user's cart (owner or admin access).
 * @route       DELETE /api/users/:userId/cart/:phoneId
 * @access      Private (Requires Authentication & Authorization)
 * @param {object} req - Express request object. Expects `req.params.userId`, `req.params.phoneId`, `req.session.user`.
 * @param {object} res - Express response object.
 * @param {function} next - Express next middleware function.
 */
exports.removeCartItem = async (req, res, next) => {
    try {
        // Get target user ID and phone ID from URL parameters
        const targetUserId = req.params.userId;
        const { phoneId } = req.params;
         // Get logged-in user info from session (for logging)
        const loggedInUser = req.session.user;

        // --- Input Validation ---
         if (!mongoose.Types.ObjectId.isValid(targetUserId)) {
             const err = new Error(`Invalid userId format in URL: ${targetUserId}`);
             err.statusCode = 400;
             return next(err);
        }
        if (!mongoose.Types.ObjectId.isValid(phoneId)) {
             const err = new Error(`Invalid phoneId format: ${phoneId}`);
             err.statusCode = 400;
             return next(err);
         }
        // ---------------

         // Authorization check is handled by the isOwnerOrAdmin middleware
        logger.info(`Controller: User ${loggedInUser?._id} removing item ${phoneId} for user ${targetUserId}`);

        // Call the service, passing target user ID and phone ID
        const updatedCart = await cartService.removeItem(targetUserId, phoneId);
        logger.info(`Controller: Item removal processed for user ${targetUserId}`);

        // Return success response
        return res.status(200).json(success({ cart: updatedCart }, 'Item removal processed successfully.'));

    } catch (err) {
        // Pass error to the errorHandler
        logger.error(`Controller: Error in removeCartItem for target user ${req.params?.userId}, phone ${req.params?.phoneId}, requester ${req.session?.user?._id}: ${err.message}`);
        next(err);
    }
};

/**
 * @description Process checkout for a user's cart
 * @route       POST /api/users/:userId/cart/checkout
 * @access      Private (Requires Authentication & Authorization)
 * @param {object} req - Express request object. Expects `req.params.userId`, `req.body.items`, `req.session.user`.
 * @param {object} res - Express response object.
 * @param {function} next - Express next middleware function.
 */
exports.checkout = async (req, res, next) => {
    try {
        const targetUserId = req.params.userId;
        const { items } = req.body;
        const loggedInUser = req.session.user;

        // Input validation
        if (!Array.isArray(items)) {
            const err = new Error('Items must be an array');
            err.statusCode = 400;
            return next(err);
        }

        for (const item of items) {
            if (!item.phoneId || !item.quantity) {
                const err = new Error('Each item must have phoneId and quantity');
                err.statusCode = 400;
                return next(err);
            }
            if (!mongoose.Types.ObjectId.isValid(item.phoneId)) {
                const err = new Error(`Invalid phoneId format: ${item.phoneId}`);
                err.statusCode = 400;
                return next(err);
            }
            if (typeof item.quantity !== 'number' || item.quantity < 1) {
                const err = new Error('Quantity must be a positive number');
                err.statusCode = 400;
                return next(err);
            }
        }

        logger.info(`Controller: User ${loggedInUser?._id} processing checkout for user ${targetUserId}`);

        const result = await cartService.checkout(targetUserId, items);
        logger.info(`Controller: Checkout completed successfully for user ${targetUserId}`);

        return res.status(200).json(success(result, 'Checkout completed successfully'));

    } catch (err) {
        logger.error(`Controller: Error in checkout for target user ${req.params?.userId}, requester ${req.session?.user?._id}: ${err.message}`);
        next(err);
    }
};