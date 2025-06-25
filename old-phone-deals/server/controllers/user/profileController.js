const profileService = require('../../service/user/profileService');
const { success: SUCCESS, error: ERROR } = require('../../utils/responseHelper');
const logger = require('../../config/logger');
const Phone = require('../../models/phone');

/**
 * =====================
 * User profile related controllers
 * =====================
 */

/**
 * Get user profile
 */
exports.getUserProfile = async (req, res) => {
  try {
    // Get user ID from session
    const userId = req.session.user._id;
    
    // Call service to get user profile
    const user = await profileService.getUserProfile(userId);
    
    return res.status(200).json(SUCCESS(200, 'Successfully get user information', user));
  } catch (error) {
    console.error('Get user profile error:', error);
    
    if (error.message === 'USER_NOT_FOUND') {
      return res.status(404).json(ERROR(404, 'User not found'));
    }
    
    return res.status(500).json(ERROR(500, 'Server error'));
  }
};

/**
 * Update user profile
 */
exports.updateUserProfile = async (req, res) => {
  try {
    const userId = req.session.user._id;
    const { firstname, lastname, email, password } = req.body;
    
    // Call service to update user profile
    const updatedUser = await profileService.updateUserProfile(
      userId,
      { firstname, lastname, email },
      password
    );
    
    // Update user information in session
    req.session.user = {
      _id: updatedUser._id,
      firstname: updatedUser.firstname,
      lastname: updatedUser.lastname,
      email: updatedUser.email
    };
    
    return res.status(200).json(SUCCESS(200, 'User profile updated', updatedUser));
  } catch (error) {
    console.error('Update user profile error:', error);
    
    // Return appropriate response based on error type
    switch (error.message) {
      case 'MISSING_REQUIRED_FIELDS':
        return res.status(400).json(ERROR(400, 'Please provide all required fields'));
      case 'USER_NOT_FOUND':
        return res.status(404).json(ERROR(404, 'User not found'));
      case 'PASSWORD_REQUIRED':
        return res.status(400).json(ERROR(400, 'Please provide password to confirm update'));
      case 'INVALID_PASSWORD':
        return res.status(401).json(ERROR(401, 'Invalid password, please enter the current account login password'));
      case 'EMAIL_ALREADY_EXISTS':
        return res.status(409).json(ERROR(409, 'The email has been used by other account'));
      default:
        return res.status(500).json(ERROR(500, 'Server error'));
    }
  }
};

/**
 * Change user password
 */
exports.changePassword = async (req, res) => {
  try {
    const userId = req.session.user._id;
    const { currentPassword, newPassword } = req.body;
    
    // Call service to change password
    await profileService.changePassword(userId, { currentPassword, newPassword });
    
    return res.status(200).json(SUCCESS(200, 'Password changed successfully'));
  } catch (error) {
    console.error('Change password error:', error);
    
    // Return appropriate response based on error type
    switch (error.message) {
      case 'MISSING_REQUIRED_FIELDS':
        return res.status(400).json(ERROR(400, 'Please provide current password and new password'));
      case 'PASSWORD_TOO_SHORT':
        return res.status(400).json(ERROR(400, 'New password must be at least 8 characters long'));
      case 'USER_NOT_FOUND':
        return res.status(404).json(ERROR(404, 'User not found'));
      case 'INVALID_CURRENT_PASSWORD':
        return res.status(401).json(ERROR(401, 'Current password is incorrect'));
      case 'SAME_PASSWORD':
        return res.status(400).json(ERROR(400, 'New password cannot be the same as the current password'));
      default:
        return res.status(500).json(ERROR(500, 'Server error'));
    }
  }
};

/**
 * =====================
 * User phone listings related controllers
 * =====================
 */

/**
 * Get user's phone listings
 */
exports.getUserListings = async (req, res) => {
  try {
    const userId = req.params.userId.toString();
    
    // Call service to get user's phone listings
    const phones = await profileService.getUserListings(userId);

    return res.status(200).json(SUCCESS(200, 'Successfully get user\'s phone listings', phones));
  } catch (error) {
    console.error('Get user\'s phone listings error:', error);
    
    if (error.message === 'USER_NOT_FOUND') {
      return res.status(404).json(ERROR(404, 'User not found'));
    }
    
    if (error.name === 'CastError') {
      return res.status(400).json(ERROR(400, 'Invalid user ID'));
    }
    
    return res.status(500).json(ERROR(500, 'Server error'));
  }
};

/**
 * Add new phone listing
 */
exports.addPhoneListing = async (req, res) => {
  try {
    const userId = req.session.user._id.toString();
    
    // Call service to add phone listing
    const newPhone = await profileService.addPhoneListing(userId, req.body);
    
    return res.status(201).json(SUCCESS(201, 'Phone listing added successfully', newPhone));
  } catch (error) {
    console.error('Add phone listing error:', error);
    
    if (error.message === 'MISSING_REQUIRED_FIELDS') {
      return res.status(400).json(ERROR(400, 'Please provide all required fields'));
    }
    
    if (error.message === 'INVALID_VALUES') {
      return res.status(400).json(ERROR(400, 'Price and stock must be non-negative'));
    }
    
    return res.status(500).json(ERROR(500, 'Server error'));
  }
};

/**
 * Update phone listing
 */
exports.updatePhoneListing = async (req, res) => {
  try {
    const phoneId = req.params.phoneId;
    const userId = req.session.user._id.toString();
    
    // Call service to update phone listing
    const phone = await profileService.updatePhoneListing(userId, phoneId, req.body);
    
    return res.status(200).json(SUCCESS(200, 'Phone listing updated successfully', phone));
  } catch (error) {
    console.error('Update phone listing error:', error);
    
    switch (error.message) {
      case 'MISSING_REQUIRED_FIELDS':
        return res.status(400).json(ERROR(400, 'Please provide all required fields'));
      case 'INVALID_VALUES':
        return res.status(400).json(ERROR(400, 'Price and stock must be non-negative'));
      case 'PHONE_NOT_FOUND':
        return res.status(404).json(ERROR(404, 'Phone listing not found'));
      case 'UNAUTHORIZED':
        return res.status(403).json(ERROR(403, 'Unauthorized to update other\'s phone listing'));
      default:
        if (error.name === 'CastError') {
          return res.status(400).json(ERROR(400, 'Invalid phone ID'));
        }
        return res.status(500).json(ERROR(500, 'Server error'));
    }
  }
};

/**
 * Delete phone listing
 */
exports.deletePhoneListing = async (req, res) => {
  try {
    const phoneId = req.params.phoneId;
    const userId = req.session.user._id.toString();
    
    // Call service to delete phone listing
    await profileService.deletePhoneListing(userId, phoneId);
    
    return res.status(200).json(SUCCESS(200, 'Phone listing deleted successfully'));
  } catch (error) {
    console.error('Delete phone listing error:', error);
    
    switch (error.message) {
      case 'PHONE_NOT_FOUND':
        return res.status(404).json(ERROR(404, 'Phone listing not found'));
      case 'UNAUTHORIZED':
        return res.status(403).json(ERROR(403, 'Unauthorized to delete other\'s phone listing'));
      default:
        if (error.name === 'CastError') {
          return res.status(400).json(ERROR(400, 'Invalid phone ID'));
        }
        return res.status(500).json(ERROR(500, 'Server error'));
    }
  }
};

/**
 * =====================
 * User comments related controllers
 * =====================
 */

/**
 * Get all comments of user's phone listings
 */
exports.getUserListingsComments = async (req, res) => {
  try {
    const userId = req.params.userId;
    
    // Call service to get user's phone listings comments
    const phonesWithComments = await profileService.getUserListingsComments(userId);
    
    return res.status(200).json(SUCCESS(200, 'Successfully get user\'s phone listings comments', phonesWithComments));
  } catch (error) {
    console.error('Get user\'s phone listings comments error:', error);
    
    if (error.message === 'USER_NOT_FOUND') {
      return res.status(404).json(ERROR(404, 'User not found'));
    }
    
    if (error.name === 'CastError') {
      return res.status(400).json(ERROR(400, 'Invalid user ID'));
    }
    
    return res.status(500).json(ERROR(500, 'Server error'));
  }
};

/**
 * Update comment visibility (hide/show)
 */
exports.updateCommentVisibility = async (req, res) => {
  try {
    const { phoneId, reviewerId, comment, hide } = req.body;
    const userId = req.session.user._id;
    
    logger.info(`Updating comment visibility - Phone ID: ${phoneId}, Reviewer ID: ${reviewerId}, User ID: ${userId}, Hide: ${hide}`);
    
    if (!phoneId || !reviewerId || !comment) {
      return res.status(400).json({
        success: false,
        message: 'phone id, reviewer id and comment are required'
      });
    }
    
    if (typeof hide !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'hide parameter must be a boolean value'
      });
    }
    
    const result = await profileService.toggleCommentVisibility(
      userId,
      phoneId,
      reviewerId,
      comment,
      hide
    );
    
    return res.status(200).json({
      success: true,
      message: `the comment has been ${hide ? 'hidden' : 'shown'}`,
      data: result
    });
  } catch (error) {
    logger.error('failed to update comment visibility:', error);
    
    if (error.message === 'PHONE_NOT_FOUND') {
      return res.status(404).json({
        success: false,
        message: 'the phone information does not exist or has been deleted'
      });
    }
    
    if (error.message === 'REVIEW_NOT_FOUND') {
      return res.status(404).json({
        success: false,
        message: 'the comment does not exist or has been deleted'
      });
    }
    
    if (error.message === 'UNAUTHORIZED') {
      return res.status(403).json({
        success: false,
        message: 'you do not have permission to perform this operation'
      });
    }
    
    return res.status(500).json({
      success: false,
      message: 'failed to perform this operation, please try again later'
    });
  }
};

/**
 * Toggle phone status (enable/disable)
 */
exports.togglePhoneStatus = async (req, res) => {
  try {
    const phoneId = req.params.phoneId;
    const userId = req.session.user._id.toString();
    
    // Find the phone to update
    const phone = await Phone.findById(phoneId);
    
    if (!phone) {
      return res.status(404).json(ERROR(404, 'Phone listing not found'));
    }
    
    // Verify if the user is the seller
    if (phone.seller.toString() !== userId) {
      return res.status(403).json(ERROR(403, 'Unauthorized to update other\'s phone listing'));
    }
    
  
    const phoneObj = phone.toObject();
    
    if (phoneObj.hasOwnProperty('disabled')) {
      await Phone.updateOne(
        { _id: phoneId },
        { $unset: { disabled: "" } }
      );
      
      logger.info(`Phone listing enabled: ${phoneId} by user: ${userId}`);
      return res.status(200).json(SUCCESS(200, 'Phone listing enabled successfully'));
    } else {
      await Phone.updateOne(
        { _id: phoneId },
        { $set: { disabled: "" } }
      );
      
      logger.info(`Phone listing disabled: ${phoneId} by user: ${userId}`);
      return res.status(200).json(SUCCESS(200, 'Phone listing disabled successfully'));
    }
  } catch (error) {
    logger.error('Toggle phone status error:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json(ERROR(400, 'Invalid phone ID'));
    }
    
    return res.status(500).json(ERROR(500, 'Server error'));
  }
};

/**
 * Upload image for product listing
 */
exports.uploadImage = async (req, res) => {
  try {
    // Check if the request body contains image data
    if (!req.body.image) {
      return res.status(400).json({
        success: false,
        message: 'Image data is required'
      });
    }

    // Call profileService.uploadImage method to save the image
    const imagePath = await profileService.uploadImage(req.body.image);
    
    return res.status(200).json({
      success: true,
      message: 'Image uploaded successfully',
      data: imagePath
    });
  } catch (error) {
    logger.error('Failed to upload image:', error);
    
    return res.status(500).json({
      success: false,
      message: 'Failed to upload image',
      error: error.message
    });
  }
};