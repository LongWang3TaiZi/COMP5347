const express = require('express');
const wishlistController = require('../../controllers/cart/wishlistController');
const { isAuthenticated, isOwnerOrAdmin } = require('../../middlewares/authMiddleware');

const router = express.Router({ mergeParams: true });

/**
 * @route   GET /api/users/:userId/wishlist
 * @desc    Get the wishlist for a specific user
 * @access  Private (Requires authentication and ownership/admin rights)
 */
router.get('/', isAuthenticated, isOwnerOrAdmin, wishlistController.getWishlist);

/**
 * @route   POST /api/users/:userId/wishlist/:phoneId
 * @desc    Add a phone to the user's wishlist
 * @access  Private (Requires authentication and ownership/admin rights)
 */
router.post('/:phoneId', isAuthenticated, isOwnerOrAdmin, wishlistController.addToWishlist);

/**
 * @route   DELETE /api/users/:userId/wishlist/:phoneId
 * @desc    Remove a phone from the user's wishlist
 * @access  Private (Requires authentication and ownership/admin rights)
 */
router.delete('/:phoneId', isAuthenticated, isOwnerOrAdmin, wishlistController.removeFromWishlist);

/**
 * @route   POST /api/users/:userId/wishlist/:phoneId/cart
 * @desc    Add a wishlist item to the user's cart
 * @access  Private (Requires authentication and ownership/admin rights)
 */
router.post('/:phoneId/cart', isAuthenticated, isOwnerOrAdmin, wishlistController.addToCart);

module.exports = router; 