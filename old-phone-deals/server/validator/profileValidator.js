const Joi = require('joi');

/**
 * User profile update validator
 */
const profileUpdateSchema = {
  body: {
    firstname: Joi.string().required().trim().messages({
      'string.empty': 'First name cannot be empty',
      'any.required': 'First name is required'
    }),
    lastname: Joi.string().required().trim().messages({
      'string.empty': 'Last name cannot be empty',
      'any.required': 'Last name is required'
    }),
    email: Joi.string().required().email().trim().messages({
      'string.email': 'Please provide a valid email format',
      'string.empty': 'Email cannot be empty',
      'any.required': 'Email is required'
    }),
    password: Joi.string().required().messages({
      'string.empty': 'Password cannot be empty',
      'any.required': 'Password is required'
    })
  }
};

module.exports = {
  profileUpdateSchema
}; 