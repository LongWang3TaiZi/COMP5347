const Phone = require('../../models/phone');
const User = require('../../models/user');
const bcrypt = require('bcrypt');
const mongoose = require('mongoose');
const { sendPasswordChangedEmail } = require('../emailService');
const logger = require('../../config/logger');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');

/**
 * Get user profile
 * @param {String} userId - User ID
 * @returns {Promise<Object>} - Return user information object
 */
const getUserProfile = async (userId) => {
    try {
        logger.info(`Getting user profile for userId: ${userId}`);
        // Query user information, excluding sensitive information
        const user = await User.findById(userId).select('-password');
        
        if (!user) {
            logger.warn(`User not found for userId: ${userId}`);
            throw new Error('USER_NOT_FOUND');
        }
        
        logger.info(`Successfully retrieved user profile for userId: ${userId}`);
        return user;
    } catch (error) {
        logger.error(`Error getting user profile for userId: ${userId}`, error);
        throw error;
    }
};

/**
 * Update user profile
 * @param {String} userId - User ID
 * @param {Object} userData - User data object
 * @param {String} userData.firstname - User name
 * @param {String} userData.lastname - User last name
 * @param {String} userData.email - User email
 * @param {String} password - Current password, used for verification
 * @returns {Promise<Object>} - Return updated user information
 */
const updateUserProfile = async (userId, userData, password) => {
    try {
        logger.info(`Updating user profile for userId: ${userId}`);
        const { firstname, lastname, email } = userData;
        
        // Validate required fields
        if (!firstname || !lastname || !email) {
            logger.warn(`Missing required fields for user profile update: ${userId}`);
            throw new Error('MISSING_REQUIRED_FIELDS');
        }
        
        // Find user - ensure full user information is retrieved, including password hash
        const user = await User.findById(userId).select('+password');
        
        if (!user) {
            logger.warn(`User not found for profile update: ${userId}`);
            throw new Error('USER_NOT_FOUND');
        }
        
        // Validate password
        if (!password) {
            logger.warn(`Password not provided for profile update: ${userId}`);
            throw new Error('PASSWORD_REQUIRED');
        }
        
        // Use bcrypt to compare passwords
        const isPasswordValid = await bcrypt.compare(String(password).trim(), user.password);
        
        if (!isPasswordValid) {
            logger.warn(`Invalid password for profile update: ${userId}`);
            throw new Error('INVALID_PASSWORD');
        }
        
        // If email changes, check if it has been used
        if (email !== user.email) {
            logger.info(`Email change detected for userId: ${userId}, checking if new email exists`);
            const emailExists = await User.findOne({ email, _id: { $ne: userId } });
            
            if (emailExists) {
                logger.warn(`Email already exists: ${email}`);
                throw new Error('EMAIL_ALREADY_EXISTS');
            }
        }
        
        // Update user information
        user.firstname = firstname;
        user.lastname = lastname;
        user.email = email;
        
        await user.save();
        logger.info(`Successfully updated user profile for userId: ${userId}`);
        
        return {
            _id: user._id,
            firstname: user.firstname,
            lastname: user.lastname,
            email: user.email
        };
    } catch (error) {
        logger.error(`Error updating user profile for userId: ${userId}`, error);
        throw error;
    }
};

/**
 * Change user password
 * @param {String} userId - User ID
 * @param {Object} passwordData - Password data object
 * @param {String} passwordData.currentPassword - Current password
 * @param {String} passwordData.newPassword - New password
 * @returns {Promise<Boolean>} - Return true on success
 */
const changePassword = async (userId, passwordData) => {
    try {
        logger.info(`Changing password for userId: ${userId}`);
        const { currentPassword, newPassword } = passwordData;
        
        // Validate required fields
        if (!currentPassword || !newPassword) {
            logger.warn(`Missing required fields for password change: ${userId}`);
            throw new Error('MISSING_REQUIRED_FIELDS');
        }
        
        // Validate new password length
        if (newPassword.length < 8) {
            logger.warn(`New password too short for userId: ${userId}`);
            throw new Error('PASSWORD_TOO_SHORT');
        }
        
        // Find user
        const user = await User.findById(userId);
        
        if (!user) {
            logger.warn(`User not found for password change: ${userId}`);
            throw new Error('USER_NOT_FOUND');
        }
        
        // Validate current password
        const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
        
        if (!isPasswordValid) {
            logger.warn(`Invalid current password for password change: ${userId}`);
            throw new Error('INVALID_CURRENT_PASSWORD');
        }
        
        // Check if new password is the same as the current password
        const isSamePassword = await bcrypt.compare(newPassword, user.password);
        
        if (isSamePassword) {
            logger.warn(`New password is same as current password for userId: ${userId}`);
            throw new Error('SAME_PASSWORD');
        }
        
        // Encrypt new password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);
        
        // Update password
        user.password = hashedPassword;
        await user.save();
        
        // Send password change notification email
        await sendPasswordChangedEmail(user);
        
        logger.info(`Successfully changed password for userId: ${userId}`);
        return true;
    } catch (error) {
        logger.error(`Error changing password for userId: ${userId}`, error);
        throw error;
    }
};

/**
 * Get user's phone listings
 * @param {String} userId - User ID
 * @returns {Promise<Array>} - Return phone listings array
 */
const getUserListings = async (userId) => {
    try {
        logger.info(`Getting phone listings for userId: ${userId}`);
        
        // Query all phone listings of the user
        const phones = await Phone.find({ seller: userId }).sort({ createdAt: -1 });
        
        logger.info(`Successfully retrieved ${phones.length} phone listings for userId: ${userId}`);
        return phones;
    } catch (error) {
        logger.error(`Error getting phone listings for userId: ${userId}`, error);
        throw error;
    }
};

/**
 * Add new phone listing
 * @param {String} userId - User ID
 * @param {Object} phoneData - Phone data object
 * @param {String} phoneData.title - Title
 * @param {String} phoneData.brand - Brand
 * @param {String} phoneData.image - Image path
 * @param {Number} phoneData.price - Price
 * @param {Number} phoneData.stock - Stock
 * @returns {Promise<Object>} - Return new created phone object
 */
const addPhoneListing = async (userId, phoneData) => {
    try {
        logger.info(`Adding new phone listing for userId: ${userId}`);
        const { title, brand, image, price, stock } = phoneData;
        
        // Validate required fields
        if (!title || !brand || !price || stock === undefined) {
            logger.warn(`Missing required fields for new phone listing: ${userId}`);
            throw new Error('MISSING_REQUIRED_FIELDS');
        }
        
        // Validate that price and stock must be positive numbers
        if (price < 0 || stock < 0) {
            logger.warn(`Invalid values for price or stock: ${userId}`);
            throw new Error('INVALID_VALUES');
        }
        
        // Create new phone listing
        const newPhone = new Phone({
            title,
            brand,
            image: image || '', // If no image is provided, set to an empty string
            price,
            stock,
            seller: userId,
            reviews: []
        });
        
        // Save to database
        await newPhone.save();
        
        logger.info(`Successfully added new phone listing for userId: ${userId}, phoneId: ${newPhone._id}`);
        return newPhone;
    } catch (error) {
        logger.error(`Error adding new phone listing for userId: ${userId}`, error);
        throw error;
    }
};

/**
 * Update phone listing
 * @param {String} userId - User ID
 * @param {String} phoneId - Phone ID
 * @param {Object} updateData - Update data object
 * @param {String} updateData.title - Title
 * @param {String} updateData.brand - Brand
 * @param {String} updateData.image - Image path
 * @param {Number} updateData.price - Price
 * @param {Number} updateData.stock - Stock
 * @returns {Promise<Object>} - Return updated phone object
 */
const updatePhoneListing = async (userId, phoneId, updateData) => {
    try {
        logger.info(`Updating phone listing for userId: ${userId}, phoneId: ${phoneId}`);
        const { title, brand, image, price, stock } = updateData;
        
        // Validate required fields
        if (!title || !brand || price === undefined || stock === undefined) {
            logger.warn(`Missing required fields for phone update: ${phoneId}`);
            throw new Error('MISSING_REQUIRED_FIELDS');
        }
        
        // Validate that price and stock must be non-negative numbers
        if (price < 0 || stock < 0) {
            logger.warn(`Invalid values for price or stock: ${phoneId}`);
            throw new Error('INVALID_VALUES');
        }
        
        // Find the phone to update
        const phone = await Phone.findById(phoneId);
        
        if (!phone) {
            logger.warn(`Phone not found for update: ${phoneId}`);
            throw new Error('PHONE_NOT_FOUND');
        }
        
        // Validate that the phone is owned by the user
        if (phone.seller.toString() !== userId) {
            logger.warn(`Unauthorized phone update attempt: ${userId} tried to update ${phoneId}`);
            throw new Error('UNAUTHORIZED');
        }
        
        // Update phone information
        phone.title = title;
        phone.brand = brand;
        phone.image = image || phone.image;
        phone.price = price;
        phone.stock = stock;
        
        await phone.save();
        
        logger.info(`Successfully updated phone listing: ${phoneId}`);
        return phone;
    } catch (error) {
        logger.error(`Error updating phone listing for phoneId: ${phoneId}`, error);
        throw error;
    }
};

/**
 * Delete phone listing
 * @param {String} userId - User ID
 * @param {String} phoneId - Phone ID
 * @returns {Promise<Boolean>} - Return true on success
 */
const deletePhoneListing = async (userId, phoneId) => {
    try {
        logger.info(`Deleting phone listing for userId: ${userId}, phoneId: ${phoneId}`);
        
        // Find the phone to delete
        const phone = await Phone.findById(phoneId);
        
        if (!phone) {
            logger.warn(`Phone not found for deletion: ${phoneId}`);
            throw new Error('PHONE_NOT_FOUND');
        }
        
        // Validate that the phone is owned by the user
        if (phone.seller.toString() !== userId) {
            logger.warn(`Unauthorized phone deletion attempt: ${userId} tried to delete ${phoneId}`);
            throw new Error('UNAUTHORIZED');
        }
        
        // Delete the phone
        await Phone.findByIdAndDelete(phoneId);
        
        logger.info(`Successfully deleted phone listing: ${phoneId}`);
        return true;
    } catch (error) {
        logger.error(`Error deleting phone listing for phoneId: ${phoneId}`, error);
        throw error;
    }
};

/**
 * Get all comments of user's phone listings
 * @param {String} userId - User ID
 * @returns {Promise<Array>} - Return an array of phone listings with comments
 */
const getUserListingsComments = async (userId) => {
    try {
        logger.info(`Getting phone listing comments for userId: ${userId.toString()}`);
        
        // Check if user exists
        const userExists = await User.exists({ _id: userId });
        
        if (!userExists) {
            logger.warn(`User not found for comments: ${userId.toString()}`);
            throw new Error('USER_NOT_FOUND');
        }
        
        // Query all phone listings of the user and populate the reviewer information
        const phones = await Phone.find({ seller: userId })
            .populate({
                path: 'reviews.reviewer',
                select: 'firstname lastname email'
            });
        
        // Construct comment response data
        const phonesWithComments = phones.map(phone => {
            return {
                _id: phone._id,
                title: phone.title,
                brand: phone.brand,
                reviews: phone.reviews,
                status: phone.status
            };
        });
        
        logger.info(`Successfully retrieved comments for ${phones.length} phone listings of userId: ${userId.toString()}`);
        return phonesWithComments;
    } catch (error) {
        logger.error(`Error getting phone listing comments for userId: ${userId.toString()}`, error);
        throw error;
    }
};

/**
 * Toggle comment visibility (hide/show)
 * @param {String} userId - User ID
 * @param {String} phoneId - Phone ID
 * @param {String} reviewerId - Reviewer ID
 * @param {String} comment - Comment content
 * @param {Boolean} hide - Whether to hide the review
 * @returns {Promise<Object>} - Return the updated review
 */
const toggleCommentVisibility = async (userId, phoneId, reviewerId, comment, hide) => {
    try {
        logger.info(`Toggling comment visibility - User ID: ${userId}, Phone ID: ${phoneId}, Reviewer ID: ${reviewerId}, Hide: ${hide}`);
        
        // Find the phone
        const phone = await Phone.findById(phoneId);
        if (!phone) {
            logger.warn(`Phone not found: ${phoneId}`);
            throw new Error('PHONE_NOT_FOUND');
        }
        
        logger.info(`Found phone: ${phone._id}, title: "${phone.title}", reviews count: ${phone.reviews.length}`);
        
        // Find the review by reviewer ID and comment content
        const review = phone.reviews.find(r => 
            r.reviewer.toString() === reviewerId.toString() && 
            r.comment === comment
        );
        
        if (!review) {
            logger.warn(`Review not found - Reviewer ID: ${reviewerId}, Comment: ${comment}`);
            logger.warn(`Available reviews: ${phone.reviews.map(r => ({
                reviewer: r.reviewer,
                comment: r.comment
            })).join(', ')}`);
            throw new Error('REVIEW_NOT_FOUND');
        }

        // Check if the user is either the seller of the phone or the reviewer
        if (phone.seller.toString() !== userId.toString() && reviewerId.toString() !== userId.toString()) {
            logger.warn(`User ${userId} is not authorized to toggle review - not the seller or reviewer`);
            throw new Error('UNAUTHORIZED');
        }
        
        // Update review visibility
        let result;
        if (hide) {
            // Hide review - add hidden field with empty string value
            result = await Phone.findOneAndUpdate(
                {
                    _id: phoneId,
                    "reviews.reviewer": reviewerId,
                    "reviews.comment": comment
                },
                {
                    $set: { "reviews.$.hidden": "" }
                },
                { new: true }
            );
        } else {
            // Show review - remove hidden field
            result = await Phone.findOneAndUpdate(
                {
                    _id: phoneId,
                    "reviews.reviewer": reviewerId,
                    "reviews.comment": comment
                },
                {
                    $unset: { "reviews.$.hidden": "" }
                },
                { new: true }
            );
        }
        
        if (!result) {
            logger.warn(`Failed to update review visibility - Phone ID: ${phoneId}, Reviewer ID: ${reviewerId}`);
            throw new Error('UPDATE_FAILED');
        }
        
        logger.info(`Successfully updated review visibility - Phone ID: ${phoneId}, Reviewer ID: ${reviewerId}, Hidden: ${hide}`);
        return result;
    } catch (error) {
        logger.error('Toggle comment visibility failed:', error);
        throw error;
    }
};

/**
 * Upload image and return the image path
 * @param {String|Buffer} image - Image data (base64 string or buffer)
 * @returns {Promise<String>} - Image path
 */
const uploadImage = async (image) => {
    try {
        if (!image) {
            throw new Error('Image is required');
        }

        // generate unique ID as file name
        const uuid = uuidv4();
        const imagePath = `/images/${uuid}.jpeg`;
        
        const fullImagePath = path.join(__dirname, '../../public', imagePath);
        
        if (Buffer.isBuffer(image)) {
            fs.writeFileSync(fullImagePath, image);
        } else if (typeof image === 'string') {
            if (image.startsWith('data:image')) {
                const base64Data = image.replace(/^data:image\/\w+;base64,/, '');
                const imageBuffer = Buffer.from(base64Data, 'base64');
                fs.writeFileSync(fullImagePath, imageBuffer);
            } else {
                const fileData = fs.readFileSync(image);
                fs.writeFileSync(fullImagePath, fileData);
            }
        } else {
            throw new Error('Unsupported image data format');
        }
        
        logger.info(`image saved successfully: ${imagePath}`);
        return imagePath;
    } catch (error) {
        logger.error(`image upload failed: ${error.message}`);
        throw error;
    }
};

// Export all functions
module.exports = {
    getUserProfile,
    updateUserProfile,
    changePassword,
    getUserListings,
    addPhoneListing,
    updatePhoneListing,
    deletePhoneListing,
    getUserListingsComments,
    toggleCommentVisibility,
    uploadImage
};

