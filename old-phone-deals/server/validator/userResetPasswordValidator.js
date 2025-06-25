const joi = require('joi');
const { passwordSchema, emailSchema } = require('./commonValidators'); // Import the shared schema

// Schema for requesting password reset (needs email)
const requestValidators = {
    email: emailSchema.required(), // Make email required
};

// Schema for performing password reset (needs password)
const performValidators = {
    password: passwordSchema.required(), // Make password required
};

// Export schema for requesting reset
exports.requestResetSchema = {
    body: requestValidators
};

// Export schema for performing reset
exports.performResetSchema = {
    body: performValidators
};

