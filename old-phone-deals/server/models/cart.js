const mongoose = require('mongoose');
const Schema = mongoose.Schema;

/**
 * @typedef {object} CartItem
 * @property {mongoose.Schema.Types.ObjectId} phone - Reference to the Phone document.
 * @property {number} quantity - Quantity of the phone in the cart. Must be at least 1.
 */

/**
 * Mongoose schema for an item within a shopping cart.
 * Represents a specific phone and its quantity.
 * Does not generate its own _id.
 * @type {mongoose.Schema<CartItem>}
 */
const CartItemSchema = new Schema({
    /**
     * Reference to the Phone model.
     * This field stores the ObjectId of the phone product.
     */
    phone: {
        type: Schema.Types.ObjectId,
        ref: 'Phone', 
        required: [true, 'Phone ID is required for a cart item.'] 
    },
    /**
     * The quantity of this specific phone in the cart.
     * Must be a positive integer, defaults to 1.
     */
    quantity: {
        type: Number,
        required: [true, 'Quantity is required for a cart item.'],
        min: [1, 'Quantity must be at least 1.'], 
        default: 1 
    }
}, { _id : false });

/**
 * @typedef {object} Cart
 * @property {mongoose.Schema.Types.ObjectId} user - Reference to the User document.
 * @property {Array<CartItem>} items - Array of items in the cart.
 * @property {Date} createdAt - Timestamp of cart creation.
 * @property {Date} updatedAt - Timestamp of last cart update.
 */

/**
 * Mongoose schema for a shopping cart.
 * Each cart belongs to a specific user and contains a list of cart items.
 * Includes timestamps for creation and updates.
 * @type {mongoose.Schema<Cart>}
 */
const CartSchema = new Schema({
    /**
     * Reference to the User model.
     * This field stores the ObjectId of the user who owns the cart.
     * Each user should have only one cart.
     */
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User', 
        required: [true, 'User ID is required for the cart.'], 
        unique: true 
    },
    /**
     * An array containing the items in the shopping cart.
     * Each element follows the CartItemSchema.
     */
    items: [CartItemSchema] 
}, {
    timestamps: true // Add timestamps
});

/**
 * Mongoose model for the Cart collection.
 * Provides an interface to interact with the carts in the database.
 * @type {mongoose.Model<Cart>}
 */
const Cart = mongoose.model('Cart', CartSchema); // Create the Cart model

module.exports = Cart; 