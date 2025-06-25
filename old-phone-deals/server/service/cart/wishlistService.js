const Wishlist = require('../../models/wishlist');
const Cart = require('../../models/cart');
const Phone = require('../../models/phone');
const logger = require('../../config/logger');
const mongoose = require('mongoose');

/**
 * Get user's wishlist
 * @param {string} userId - The ID of the user
 * @returns {Promise<Object>} - A promise that resolves to the wishlist object
 */
const getWishlist = async (userId) => {
    logger.info(`WishlistService: Getting wishlist for user ${userId}`);
    try {
        let wishlist = await Wishlist.findOne({ user: userId })
            .populate({
                path: 'items.phone',
                select: 'title price image stock brand'
            });

        if (!wishlist) {
            logger.info(`WishlistService: No wishlist found for user ${userId}, creating a new one.`);
            wishlist = await Wishlist.create({ user: userId, items: [] });
        }

        return wishlist;
    } catch (error) {
        logger.error(`WishlistService: Error getting wishlist for user ${userId}:`, error);
        throw new Error(`Failed to get wishlist for user ${userId}`);
    }
};

/**
 * Add item to wishlist
 * @param {string} userId - The ID of the user
 * @param {string} phoneId - The ID of the phone to add
 * @returns {Promise<Object>} - A promise that resolves to the updated wishlist
 */
const addToWishlist = async (userId, phoneId) => {
    logger.info(`WishlistService: Adding phone ${phoneId} to wishlist for user ${userId}`);
    try {
        // Verify phone exists
        const phone = await Phone.findById(phoneId);
        if (!phone) {
            throw new Error(`Phone with ID ${phoneId} not found`);
        }

        let wishlist = await Wishlist.findOne({ user: userId });
        if (!wishlist) {
            wishlist = await Wishlist.create({ user: userId, items: [] });
        }

        // Check if item already exists in wishlist
        const itemExists = wishlist.items.some(item => item.phone.toString() === phoneId);
        if (itemExists) {
            throw new Error('Item already in wishlist');
        }

        // Add item to wishlist
        wishlist.items.push({ phone: phoneId });
        await wishlist.save();

        // Return updated wishlist with populated phone details
        return await Wishlist.findById(wishlist._id)
            .populate({
                path: 'items.phone',
                select: 'title price image stock brand'
            });
    } catch (error) {
        logger.error(`WishlistService: Error adding to wishlist for user ${userId}:`, error);
        throw error;
    }
};

/**
 * Remove item from wishlist
 * @param {string} userId - The ID of the user
 * @param {string} phoneId - The ID of the phone to remove
 * @returns {Promise<Object>} - A promise that resolves to the updated wishlist
 */
const removeFromWishlist = async (userId, phoneId) => {
    logger.info(`WishlistService: Removing phone ${phoneId} from wishlist for user ${userId}`);
    try {
        const wishlist = await Wishlist.findOne({ user: userId });
        if (!wishlist) {
            throw new Error('Wishlist not found');
        }

        // Remove item from wishlist
        wishlist.items = wishlist.items.filter(item => item.phone.toString() !== phoneId);
        await wishlist.save();

        // Return updated wishlist with populated phone details
        return await Wishlist.findById(wishlist._id)
            .populate({
                path: 'items.phone',
                select: 'title price image stock brand'
            });
    } catch (error) {
        logger.error(`WishlistService: Error removing from wishlist for user ${userId}:`, error);
        throw error;
    }
};

/**
 * Add wishlist item to cart
 * @param {string} userId - The ID of the user
 * @param {string} phoneId - The ID of the phone to add to cart
 * @returns {Promise<Object>} - A promise that resolves to the updated cart
 */
const addToCart = async (userId, phoneId) => {
    logger.info(`WishlistService: Adding phone ${phoneId} to cart for user ${userId}`);
    try {
        // Start a session for transaction
        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            // Verify phone exists and has stock
            const phone = await Phone.findById(phoneId);
            if (!phone) {
                throw new Error(`Phone with ID ${phoneId} not found`);
            }
            if (phone.stock < 1) {
                throw new Error(`Phone "${phone.title}" is out of stock`);
            }

            // Add to cart
            let cart = await Cart.findOne({ user: userId });
            if (!cart) {
                cart = await Cart.create({ user: userId, items: [] });
            }

            const itemIndex = cart.items.findIndex(item => item.phone.toString() === phoneId);
            if (itemIndex > -1) {
                cart.items[itemIndex].quantity += 1;
            } else {
                cart.items.push({ phone: phoneId, quantity: 1 });
            }

            await cart.save({ session });

            // Remove from wishlist
            const wishlist = await Wishlist.findOne({ user: userId });
            if (wishlist) {
                wishlist.items = wishlist.items.filter(item => item.phone.toString() !== phoneId);
                await wishlist.save({ session });
            }

            // Commit transaction
            await session.commitTransaction();

            // Return updated cart with populated phone details
            return await Cart.findById(cart._id)
                .populate({
                    path: 'items.phone',
                    select: 'title price image stock brand'
                });
        } catch (error) {
            await session.abortTransaction();
            throw error;
        } finally {
            session.endSession();
        }
    } catch (error) {
        logger.error(`WishlistService: Error adding to cart for user ${userId}:`, error);
        throw error;
    }
};

module.exports = {
    getWishlist,
    addToWishlist,
    removeFromWishlist,
    addToCart
}; 