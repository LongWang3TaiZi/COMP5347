const wishlistService = require('../../service/cart/wishlistService');
const { success } = require('../../utils/responseHelper');
const logger = require('../../config/logger');
const mongoose = require('mongoose');

/**
 * @description Get user's wishlist
 * @route       GET /api/users/:userId/wishlist
 * @access      Private (Requires Authentication & Authorization)
 */
exports.getWishlist = async (req, res, next) => {
    try {
        const targetUserId = req.params.userId;
        const loggedInUser = req.session.user;

        logger.info(`Controller: User ${loggedInUser?._id} requesting wishlist for user ${targetUserId}`);

        const wishlist = await wishlistService.getWishlist(targetUserId);
        logger.info(`Controller: Successfully retrieved wishlist for user ${targetUserId}`);

        return res.status(200).json(success({ wishlist }, 'Wishlist retrieved successfully'));
    } catch (err) {
        logger.error(`Controller: Error in getWishlist for target user ${req.params?.userId}, requester ${req.session?.user?._id}: ${err.message}`);
        next(err);
    }
};

/**
 * @description Add item to wishlist
 * @route       POST /api/users/:userId/wishlist/:phoneId
 * @access      Private (Requires Authentication & Authorization)
 */
exports.addToWishlist = async (req, res, next) => {
    try {
        const targetUserId = req.params.userId;
        const { phoneId } = req.params;
        const loggedInUser = req.session.user;

        // Input validation
        if (!mongoose.Types.ObjectId.isValid(phoneId)) {
            const err = new Error(`Invalid phoneId format: ${phoneId}`);
            err.statusCode = 400;
            return next(err);
        }

        logger.info(`Controller: User ${loggedInUser?._id} adding phone ${phoneId} to wishlist for user ${targetUserId}`);

        const wishlist = await wishlistService.addToWishlist(targetUserId, phoneId);
        logger.info(`Controller: Successfully added phone ${phoneId} to wishlist for user ${targetUserId}`);

        return res.status(200).json(success({ wishlist }, 'Item added to wishlist successfully'));
    } catch (err) {
        logger.error(`Controller: Error in addToWishlist for target user ${req.params?.userId}, phone ${req.params?.phoneId}, requester ${req.session?.user?._id}: ${err.message}`);
        next(err);
    }
};

/**
 * @description Remove item from wishlist
 * @route       DELETE /api/users/:userId/wishlist/:phoneId
 * @access      Private (Requires Authentication & Authorization)
 */
exports.removeFromWishlist = async (req, res, next) => {
    try {
        const targetUserId = req.params.userId;
        const { phoneId } = req.params;
        const loggedInUser = req.session.user;

        // Input validation
        if (!mongoose.Types.ObjectId.isValid(phoneId)) {
            const err = new Error(`Invalid phoneId format: ${phoneId}`);
            err.statusCode = 400;
            return next(err);
        }

        logger.info(`Controller: User ${loggedInUser?._id} removing phone ${phoneId} from wishlist for user ${targetUserId}`);

        const wishlist = await wishlistService.removeFromWishlist(targetUserId, phoneId);
        logger.info(`Controller: Successfully removed phone ${phoneId} from wishlist for user ${targetUserId}`);

        return res.status(200).json(success({ wishlist }, 'Item removed from wishlist successfully'));
    } catch (err) {
        logger.error(`Controller: Error in removeFromWishlist for target user ${req.params?.userId}, phone ${req.params?.phoneId}, requester ${req.session?.user?._id}: ${err.message}`);
        next(err);
    }
};

/**
 * @description Add wishlist item to cart
 * @route       POST /api/users/:userId/wishlist/:phoneId/cart
 * @access      Private (Requires Authentication & Authorization)
 */
exports.addToCart = async (req, res, next) => {
    try {
        const targetUserId = req.params.userId;
        const { phoneId } = req.params;
        const loggedInUser = req.session.user;

        // Input validation
        if (!mongoose.Types.ObjectId.isValid(phoneId)) {
            const err = new Error(`Invalid phoneId format: ${phoneId}`);
            err.statusCode = 400;
            return next(err);
        }

        logger.info(`Controller: User ${loggedInUser?._id} adding phone ${phoneId} to cart from wishlist for user ${targetUserId}`);

        const cart = await wishlistService.addToCart(targetUserId, phoneId);
        logger.info(`Controller: Successfully added phone ${phoneId} to cart from wishlist for user ${targetUserId}`);

        return res.status(200).json(success({ cart }, 'Item added to cart successfully'));
    } catch (err) {
        logger.error(`Controller: Error in addToCart for target user ${req.params?.userId}, phone ${req.params?.phoneId}, requester ${req.session?.user?._id}: ${err.message}`);
        next(err);
    }
}; 