const mongoose = require('mongoose');
const Schema = mongoose.Schema;

/**
 * PasswordResetTokenSchema defines the structure of the PasswordResetToken model.
 * 
 * @property {ObjectId} userId - Reference to the User model.
 * @property {String} token - The reset token, indexed for faster lookup.
 * @property {Date} expiresAt - The date and time when the token expires.
 */
const PasswordResetTokenSchema = new Schema({
    userId: {
        /*
        Attention:
        Reference to the User model
        */
        type: Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    },
    token: {
        type: String,
        required: true,
        index: true
    },
    expiresAt: {
        type: Date,
        required: true,
        expires: '24h' //expires after 24 hours
    }
}, 
{
    timestamps: true //record creation time (createdAt)
});

/**
 * PasswordResetToken model represents a password reset token in the database.
 */
const PasswordResetToken = mongoose.model('PasswordResetToken', PasswordResetTokenSchema);

module.exports = PasswordResetToken;