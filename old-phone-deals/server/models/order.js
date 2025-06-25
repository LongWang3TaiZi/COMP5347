const mongoose = require('mongoose');
const Schema = mongoose.Schema;

/**
 * @typedef {object} OrderItem
 * @property {mongoose.Schema.Types.ObjectId} phone - Reference to the Phone document.
 * @property {number} quantity - Quantity of the phone in the order.
 * @property {number} price - Price of the phone at the time of order.
 */

/**
 * Mongoose schema for an item within an order.
 * Represents a specific phone and its quantity in the order.
 * @type {mongoose.Schema<OrderItem>}
 */
const OrderItemSchema = new Schema({
    phone: {
        type: Schema.Types.ObjectId,
        ref: 'Phone',
        required: [true, 'Phone ID is required for an order item.']
    },
    quantity: {
        type: Number,
        required: [true, 'Quantity is required for an order item.'],
        min: [1, 'Quantity must be at least 1.']
    },
    price: {
        type: Number,
        required: [true, 'Price is required for an order item.'],
        min: [0, 'Price cannot be negative.'],
        set: v => Number(v.toFixed(2))
    }
}, { _id: false });

/**
 * @typedef {object} Order
 * @property {mongoose.Schema.Types.ObjectId} user - Reference to the User document (buyer).
 * @property {Array<OrderItem>} items - Array of items in the order.
 * @property {number} totalAmount - Total amount of the order.
 * @property {string} status - Status of the order.
 * @property {string} paymentMethod - Method of payment.
 * @property {string} note - Optional note for the order.
 */

/**
 * Mongoose schema for an order.
 * Each order belongs to a specific user and contains a list of order items.
 * @type {mongoose.Schema<Order>}
 */
const OrderSchema = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'User ID is required for the order.']
    },
    items: [OrderItemSchema],
    totalAmount: {
        type: Number,
        required: [true, 'Total amount is required.'],
        min: [0, 'Total amount cannot be negative.']
    },
    status: {
        type: String,
        enum: ['pending', 'completed', 'cancelled'],
        default: 'pending'
    },
    paymentMethod: {
        type: String,
        enum: ['credit_card', 'paypal', 'bank_transfer'],
        default: 'credit_card'
    },
    note: {
        type: String,
        trim: true
    }
}, {
    timestamps: true
});

/**
 * Mongoose model for the Order collection.
 * Provides an interface to interact with the orders in the database.
 * @type {mongoose.Model<Order>}
 */
const Order = mongoose.model('Order', OrderSchema);

module.exports = Order; 