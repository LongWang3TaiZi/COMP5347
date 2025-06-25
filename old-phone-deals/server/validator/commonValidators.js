const joi = require('joi');

// Define the shared password schema
const passwordSchema = joi.string()
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,}$/)
    .required()
    .messages({
        'string.pattern.base': 'Password must contain at least 8 characters, including at least one uppercase letter, one lowercase letter, and one number',
        'any.required': 'Password is required'
    });

exports.passwordSchema = passwordSchema;

// Define the shared email schema
const emailSchema = joi.string()
    .email()
    .required()
    .messages({
        'string.email': '"email" must be a valid email',
        'any.required': '"email" is required'
    });

exports.emailSchema = emailSchema;
