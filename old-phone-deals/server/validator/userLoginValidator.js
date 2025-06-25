const joi = require('joi');

const validators = {
    email: joi.string()
        .email()
        .required()
        .messages({
            'string.email': 'Please enter a valid email address',
            'any.required': 'Email is required'
        }),
    password: joi.string()
        .min(8)
        .required()
        .messages({
            'string.empty': 'Password cannot be empty',
            'string.min': 'Password must be at least 8 characters long',
            'any.required': 'Password is required'
        })
};

exports.loginSchema = {
    body: {
        email: validators.email,
        password: validators.password
    }
};

exports.validators = validators;