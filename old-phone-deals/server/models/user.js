const mongoose = require('mongoose');
const Schema = mongoose.Schema;

/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           description: auto generated id
 *         firstname:
 *           type: string
 *           description: user first name
 *         lastname:
 *           type: string
 *           description: user last name
 *         email:
 *           type: string
 *           description: user email
 *         password:
 *           type: string
 *           description: user password
 *         status:
 *           type: string
 *           description: user status
 */
const UserSchema = new Schema({
    firstname: {
        type: String,
        trim: true
    },
    lastname: {
        type: String,
        trim: true
    },
    email: {
        type: String,
        unique: true,
        trim: true,
        lowercase: true
    },
    password: {
        type: String,
    },
    status: {
        type: String,
        enum: ['active', 'inactive', 'pending'],
        default: 'pending'
    },
    role: {
        type: String,
        enum: ['admin', 'user', 'superAdmin'],
        default: 'user'
    },
    lastLoginTime: {
        type: Date
    },
    
}, {
    timestamps: true
});

const User = mongoose.model('User', UserSchema);

module.exports = User;