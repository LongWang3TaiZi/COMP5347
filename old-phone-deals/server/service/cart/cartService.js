const Cart = require('../../models/cart');
const Phone = require('../../models/phone'); 
const User = require('../../models/user'); 
const Order = require('../../models/order');
const logger = require('../../config/logger');
const mongoose = require('mongoose');
const { broadcast } = require('../../utils/websocket');

/**
 * Retrieves the shopping cart for a specific user by their ID, populating the phone details for each item.
 * @param {string} userId - The ObjectId of the user.
 * @returns {Promise<Cart|null>} - A promise that resolves to the cart object with populated phone details in the items array, or null if the cart is not found.
 */
const getCartByUserId = async (userId) => {
    logger.info(`CartService: Getting cart for user ${userId}`);
    try {
        /**
         * Find the cart belonging to the specified user.
         * Uses `findOne` to locate the cart document where the 'user' field matches the userId.
         * Populates the 'phone' field within each element of the 'items' array.
         * This replaces the ObjectId reference with selected fields from the actual Phone document.
         */
        let cart = await Cart.findOne({ user: userId })
                             .populate({
                                 path: 'items.phone', 
                                 select: 'title price image stock brand' 
                             });

        if (!cart) {
            logger.info(`CartService: No cart found for user ${userId}, creating a new one.`);
            cart = await Cart.create({ user: userId, items: [] });
        } else {
             logger.info(`CartService: Found cart for user ${userId}. Items count: ${cart.items.length}`);
        }


        return cart; 

    } catch (error) {
        logger.error(`CartService: Error getting cart for user ${userId}:`, error);
        throw new Error(`Failed to get or create cart for user ${userId}`); 
    }
};

/**
 * Adds an item to the user's cart, updates its quantity, or removes it if quantity is 0.
 * @param {string} userId - The ID of the user.
 * @param {string} phoneId - The ID of the phone to add/update/remove.
 * @param {number} quantity - The desired new quantity. If 0, the item is removed. Must be >= 0.
 * @returns {Promise<Object>} - A promise that resolves to the updated and populated cart object.
 * @throws {Error} - Throws an error if the phone is not found, stock is insufficient,
 *                   or other database issues occur. The error includes a `statusCode` property.
 */
const addOrUpdateItem = async (userId, phoneId, quantity) => {
    logger.info(`CartService: Updating item ${phoneId} (qty: ${quantity}) for user ${userId}`);
    try {

        const phoneObjectId = new mongoose.Types.ObjectId(phoneId);
        const phone = await Phone.findById(phoneId);
        if (!phone) {
            const err = new Error(`Phone with ID ${phoneId} not found.`);
            err.statusCode = 404; 
            throw err;
        }
        logger.debug(`CartService: Phone ${phoneId} found. Stock: ${phone.stock}`);

        let cart = await Cart.findOne({ user: userId });
        if (!cart) {
            logger.info(`CartService: No cart found during update for user ${userId}, creating.`);
            cart = await Cart.create({ user: userId, items: [] });
        }

        const itemIndex = cart.items.findIndex(item => item.phone.toString() === phoneId);

        if (quantity === 0) {
            if (itemIndex > -1) {
                logger.info(`CartService: Quantity is 0, removing item ${phoneId} for user ${userId}`);
                cart.items.pull({ _id: cart.items[itemIndex]._id }); // Efficiently remove sub-document
            } else {
                logger.info(`CartService: Quantity is 0, but item ${phoneId} not in cart for user ${userId}. No action.`);
            }
        } else {
            if (quantity > phone.stock) {
                const err = new Error(`Insufficient stock for phone "${phone.title}". Available: ${phone.stock}.`);
                err.statusCode = 400; // Bad Request
                throw err;
            }

            if (itemIndex > -1) {
                // Update existing item's quantity
                logger.info(`CartService: Updating quantity for item ${phoneId} to ${quantity} for user ${userId}`);
                cart.items[itemIndex].quantity = quantity;
            } else {
                // Add new item to cart
                 logger.info(`CartService: Adding new item ${phoneId} with quantity ${quantity} for user ${userId}`);
                cart.items.push({ phone: phoneId, quantity: quantity });
            }
        }

        await cart.save();
        logger.debug(`CartService: Cart saved successfully for user ${userId}.`);

        const updatedCart = await Cart.findById(cart._id) // Use findById to ensure fresh data after save
                                       .populate({
                                           path: 'items.phone',
                                           select: 'title price image stock'
                                       });
        return updatedCart;

    } catch (error) {
        if (error.statusCode) {
            logger.warn(`CartService: Business logic error for user ${userId} - ${error.message}`);
            throw error;
        }
        logger.error(`CartService: Error updating item for user ${userId}:`, error);
        const serviceError = new Error(`Failed to update cart item for user ${userId}.`);
        serviceError.statusCode = 500;
        throw serviceError;
    }
};


/**
 * Removes a specific item from the user's shopping cart.
 * @param {string} userId - The ID of the user.
 * @param {string} phoneId - The ID of the phone to remove.
 * @returns {Promise<Object>} - A promise that resolves to the updated and populated cart object.
 *                              Returns the current cart state even if the item wasn't found in the cart.
 * @throws {Error} - Throws an error if a database error occurs. The error includes a `statusCode` property.
 */
const removeItem = async (userId, phoneId) => {
    logger.info(`CartService: Removing item ${phoneId} for user ${userId}`);
    try {
        let cart = await Cart.findOne({ user: userId });

        if (!cart) {
            logger.warn(`CartService: Cart not found for user ${userId} when trying to remove item ${phoneId}.`);
            return { user: userId, items: [], _id: null, createdAt: null, updatedAt: null };
        }

        // Find the index of the item to remove
        const itemIndex = cart.items.findIndex(item => item.phone.toString() === phoneId);

        if (itemIndex > -1) {
            logger.info(`CartService: Found item ${phoneId}, removing.`);
            // Remove only the specific item
            cart.items.splice(itemIndex, 1);
            await cart.save();
            logger.debug(`CartService: Item removed and cart saved for user ${userId}.`);
        } else {
            logger.warn(`CartService: Item ${phoneId} not found in cart for user ${userId} during removal. No changes made.`);
        }

        // Get fresh cart data with populated phone details
        const updatedCart = await Cart.findById(cart._id)
            .populate({
                path: 'items.phone',
                select: 'title price image stock'
            });

        return updatedCart;

    } catch (error) {
        logger.error(`CartService: Error removing item ${phoneId} for user ${userId}:`, error);
        const serviceError = new Error(`Failed to remove cart item for user ${userId}.`);
        serviceError.statusCode = 500;
        throw serviceError;
    }
};

/**
 * Clears all items from the user's shopping cart.
 * @param {string} userId - The ID of the user whose cart should be cleared.
 * @returns {Promise<Object>} - The updated (empty) cart object. Returns an empty-like structure if no cart existed.
 * @throws {Error} - If a database error occurs. Includes statusCode.
 */
const clearCart = async (userId) => {
    logger.info(`CartService: Attempting to clear cart for user ${userId}`);
    try {
        const cart = await Cart.findOne({ user: userId });

        if (!cart) {
            logger.warn(`CartService: Cart not found for user ${userId} when attempting to clear. No action needed.`);
            return { user: userId, items: [], _id: null, createdAt: null, updatedAt: null };
        }

        cart.items = [];
        await cart.save();
        logger.info(`CartService: Cart cleared successfully for user ${userId}.`);

        return cart;

    } catch (error) {
        logger.error(`CartService: Error clearing cart for user ${userId}:`, error);
        const serviceError = new Error(`Failed to clear cart for user ${userId}.`);
        serviceError.statusCode = 500; // Internal Server Error
        throw serviceError;
    }
};

/**
 * Process checkout for a user's cart
 * @param {string} userId - The ID of the user
 * @param {Array<{phoneId: string, quantity: number}>} items - Array of items to checkout
 * @returns {Promise<Object>} - A promise that resolves to the updated cart object
 * @throws {Error} - Throws an error if stock is insufficient or other issues occur
 */
const checkout = async (userId, items) => {
    logger.info(`CartService: Processing checkout for user ${userId}`);
    try {
        // Start a session for transaction
        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            // Get the cart
            const cart = await Cart.findOne({ user: userId }).populate('items.phone');
            if (!cart) {
                throw new Error('Cart not found');
            }

            // Validate stock for all items
            for (const item of items) {
                const phone = await Phone.findById(item.phoneId);
                if (!phone) {
                    throw new Error(`Phone with ID ${item.phoneId} not found`);
                }
                if (phone.stock < item.quantity) {
                    throw new Error(`Insufficient stock for phone "${phone.title}". Available: ${phone.stock}`);
                }
            }

            // Create order items array with current prices
            const orderItems = [];
            let totalAmount = 0;

            for (const item of items) {
                const phone = await Phone.findById(item.phoneId);
                const itemTotal = phone.price * item.quantity;
                totalAmount += itemTotal;

                orderItems.push({
                    phone: item.phoneId,
                    quantity: item.quantity,
                    price: phone.price
                });
            }

            // Create new order
            const order = new Order({
                user: userId,
                items: orderItems,
                totalAmount: totalAmount,
                status: 'completed'
            });

            // Update stock for all items
            for (const item of items) {
                await Phone.findByIdAndUpdate(
                    item.phoneId,
                    { $inc: { stock: -item.quantity } },
                    { session }
                );
            }

            // Save the order
            await order.save({ session });

            // Clear the cart
            cart.items = [];
            await cart.save({ session });

            // Commit the transaction
            await session.commitTransaction();
            logger.info(`CartService: Checkout completed successfully for user ${userId}`);

            // Send WebSocket notification
            const populatedOrder = await Order.findById(order._id)
                .populate('user', 'firstname lastname email')
                .populate('items.phone', 'title brand price');
            
            broadcast({
                type: 'NEW_ORDER',
                data: populatedOrder
            });

            return { 
                success: true, 
                message: 'Checkout completed successfully',
                orderId: order._id
            };
        } catch (error) {
            // If an error occurred, abort the transaction
            await session.abortTransaction();
            throw error;
        } finally {
            session.endSession();
        }
    } catch (error) {
        logger.error(`CartService: Error during checkout for user ${userId}:`, error);
        throw error;
    }
};

module.exports = {
    getCartByUserId,
    addOrUpdateItem,
    removeItem,
    clearCart,
    checkout
};