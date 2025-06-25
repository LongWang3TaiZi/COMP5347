const mongoose = require('mongoose');
const Schema = mongoose.Schema;

/**
 * @typedef {object} WishlistItem
 * @property {mongoose.Schema.Types.ObjectId} phone - Reference to the Phone document.
 */

/**
 * Mongoose schema for an item within a wishlist.
 * Represents a specific phone.
 * Does not generate its own _id.
 * @type {mongoose.Schema<WishlistItem>}
 */
const WishlistItemSchema = new Schema({
    /**
     * Reference to the Phone model.
     * This field stores the ObjectId of the phone product.
     */
    phone: {
        type: Schema.Types.ObjectId,
        ref: 'Phone', 
        required: [true, 'Phone ID is required for a wishlist item.'] 
    }
}, { _id: false });

/**
 * @typedef {object} Wishlist
 * @property {mongoose.Schema.Types.ObjectId} user - Reference to the User document.
 * @property {Array<WishlistItem>} items - Array of items in the wishlist.
 * @property {Date} createdAt - Timestamp of wishlist creation.
 * @property {Date} updatedAt - Timestamp of last wishlist update.
 */

/**
 * Mongoose schema for a wishlist.
 * Each wishlist belongs to a specific user and contains a list of wishlist items.
 * Includes timestamps for creation and updates.
 * @type {mongoose.Schema<Wishlist>}
 */
const WishlistSchema = new Schema({
    /**
     * Reference to the User model.
     * This field stores the ObjectId of the user who owns the wishlist.
     * Each user should have only one wishlist.
     */
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User', 
        required: [true, 'User ID is required for the wishlist.'], 
        unique: true 
    },
    /**
     * An array containing the items in the wishlist.
     * Each element follows the WishlistItemSchema.
     */
    items: [WishlistItemSchema] 
}, {
    timestamps: true // Add timestamps
});

/**
 * Mongoose model for the Wishlist collection.
 * Provides an interface to interact with the wishlists in the database.
 * @type {mongoose.Model<Wishlist>}
 */
const Wishlist = mongoose.model('Wishlist', WishlistSchema);

module.exports = Wishlist; 