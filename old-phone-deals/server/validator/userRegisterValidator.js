const joi = require('joi');

const validators = {
    firstname: joi.string().trim().min(1).required().messages({
        'string.empty': 'First name cannot be empty',
        'any.required': 'First name is required'
    }),
    lastname: joi.string().trim().min(1).required().messages({
        'string.empty': 'Last name cannot be empty',
        'any.required': 'Last name is required'
    }),
    email: joi.string().email().required().messages({
        'string.email': 'Please provide a valid email format',
        'any.required': 'Email is required'
    }),
    password: joi.string()
        .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/)
        .required()
        .messages({
            'string.pattern.base': 'Password must contain at least 8 characters, including at least one uppercase letter, one lowercase letter, one number, and one special character (@$!%*?&)',
            'any.required': 'Password is required'
        })
};


exports.signupSchema = {
    body: {
        firstname: validators.firstname,
        lastname: validators.lastname,
        email: validators.email,
        password: validators.password
    }
};

exports.validators = validators