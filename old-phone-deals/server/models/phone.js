const mongoose = require('mongoose');
const Schema = mongoose.Schema;

/**
 * @swagger
 * components:
 *   schemas:
 *     Review:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           description: auto generated id
 *         reviewer:
 *           type: string
 *           description: reviewer id
 *         rating:
 *           type: number
 *           description: rating
 *         comment:
 *           type: string
 *           description: comment
 *
 */
// review sub-document schema
const ReviewSchema = new Schema({
    reviewer: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    rating: {
        type: Number,
        min: 1,
        max: 5
    },
    comment: {
        type: String
    },
    hidden: {
        type: String
    }
}, {
    timestamps: true
});
/**
 * @swagger
 * components:
 *   schemas:
 *     Phone:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           description: auto generated id
 *         title:
 *           type: string
 *           description: phone title
 *         brand:
 *           type: string
 *           description: phone brand
 *         image:
 *           type: string
 *           description: phone image path
 *         stock:
 *           type: number
 *           description: phone stock
 *         seller:
 *           type: string
 *           description: phone seller
 *         price:
 *           type: number
 *           description: phone price
 *         reviews:
 *           type: array
 *           description: phone reviews
 */
// phone schema definition
const PhoneSchema = new Schema({
    title: {
        type: String,
        trim: true
    },
    brand: {
        type: String,
        trim: true
    },
    image: {
        type: String
    },
    stock: {
        type: Number,
        min: 0,
        default: 0
    },
    seller: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    price: {
        type: Number,
        min: 0
    },
    status: {
        type: String,
        enum: ['available', 'disabled'],
        default: 'available'
    },
    disabled: {
        type: String
    },
    reviews: [ReviewSchema]
}, {
    timestamps: true
});


const Phone = mongoose.model('Phone', PhoneSchema);

module.exports = Phone;