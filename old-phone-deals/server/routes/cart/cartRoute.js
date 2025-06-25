const express = require('express');
const cartController = require('../../controllers/cart/cartController');
const { isAuthenticated, isOwnerOrAdmin } = require('../../middlewares/authMiddleware');

// Create a router instance. `mergeParams: true` allows access to parent route parameters (e.g., :userId).
const router = express.Router({ mergeParams: true });

/**
 * @route   GET /api/users/:userId/cart
 * @desc    Get the shopping cart for a specific user.
 * @access  Private (Requires authentication and ownership/admin rights)
 * @middleware isAuthenticated - Ensures the user is logged in.
 * @middleware isOwnerOrAdmin - Ensures the logged-in user is the owner of the cart or an admin.
 */
router.get('/', isAuthenticated, isOwnerOrAdmin, cartController.getCart);

/**
 * @route   PUT /api/users/:userId/cart/:phoneId
 * @desc    Update the quantity of a specific phone item in the user's cart.
 *          Adds the item if it doesn't exist. Removes if quantity is 0.
 * @access  Private (Requires authentication and ownership/admin rights)
 * @param   {string} phoneId - The ID of the phone to update in the cart.
 * @body    {number} quantity - The new quantity for the item (non-negative integer).
 * @middleware isAuthenticated - Ensures the user is logged in.
 * @middleware isOwnerOrAdmin - Ensures the logged-in user is the owner of the cart or an admin.
 */
router.put('/:phoneId', isAuthenticated, isOwnerOrAdmin, cartController.updateCartItemQuantity);

/**
 * @route   DELETE /api/users/:userId/cart/:phoneId
 * @desc    Remove a specific phone item from the user's shopping cart.
 * @access  Private (Requires authentication and ownership/admin rights)
 * @param   {string} phoneId - The ID of the phone to remove from the cart.
 * @middleware isAuthenticated - Ensures the user is logged in.
 * @middleware isOwnerOrAdmin - Ensures the logged-in user is the owner of the cart or an admin.
 */
router.delete('/:phoneId', isAuthenticated, isOwnerOrAdmin, cartController.removeCartItem);

/**
 * @route   POST /api/users/:userId/cart/checkout
 * @desc    Process checkout for the user's cart
 * @access  Private (Requires authentication and ownership/admin rights)
 * @body    {Array<{phoneId: string, quantity: number}>} items - Array of items to checkout
 * @middleware isAuthenticated - Ensures the user is logged in.
 * @middleware isOwnerOrAdmin - Ensures the logged-in user is the owner of the cart or an admin.
 */
router.post('/checkout', isAuthenticated, isOwnerOrAdmin, cartController.checkout);

module.exports = router;