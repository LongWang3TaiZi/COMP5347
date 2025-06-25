const Joi = require('joi');

/**
 * Password change validator
 */
const changePasswordSchema = {
  body: {
    currentPassword: Joi.string().required().messages({
      'string.empty': 'Current password cannot be empty',
      'any.required': 'Current password is required'
    }),
    newPassword: Joi.string().required().min(8).messages({
      'string.empty': 'New password cannot be empty',
      'string.min': 'New password must be at least 8 characters long',
      'any.required': 'New password is required'
    })
  }
};

module.exports = {
  changePasswordSchema
}; 