const Joi = require('joi');

/**
 * Listing validator
 */
const listingSchema = {
  body: {
    title: Joi.string().required().trim().max(200).messages({
      'string.empty': 'Title cannot be empty',
      'string.max': 'Title length cannot exceed 200 characters',
      'any.required': 'Title is required'
    }),
    brand: Joi.string().required().trim().messages({
      'string.empty': 'Brand cannot be empty',
      'any.required': 'Brand is required'
    }),
    image: Joi.string().allow('').optional(),
    price: Joi.number().required().min(0).messages({
      'number.base': 'Price must be a number',
      'number.min': 'Price cannot be negative',
      'any.required': 'Price is required'
    }),
    stock: Joi.number().integer().required().min(0).messages({
      'number.base': 'Stock must be a number',
      'number.integer': 'Stock must be an integer',
      'number.min': 'Stock cannot be negative',
      'any.required': 'Stock is required'
    }),
    description: Joi.string().allow('').optional()
  }
};

module.exports = {
  listingSchema
}; 