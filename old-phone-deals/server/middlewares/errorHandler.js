/**
 * Error handling middleware
 * Handles application errors including validation errors from @escook/express-joi
 *
 * @module middleware/errorHandler
 */
const { error } = require('../utils/responseHelper');
const logger = require('../config/logger')

/**
 * Global error handling middleware
 * Captures and formats all errors thrown during request processing
 *
 * @param {Error} err - The error object
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 * @returns {Object} Formatted error response
 */
const errorHandler = (err, req, res, next) => {
  logger.error(`Error occurred: ${err.message}`, {
    errorName: err.name, 
    statusCode: err.statusCode, 
    route: req.originalUrl,
    method: req.method,
    ip: req.ip,
    stack: err.stack 
  });

  if (res.headersSent) {
    logger.warn('Headers already sent, delegating to default error handler.');
    return next(err);
  }

  let statusCode = 500;
  let message = 'Internal Server Error'; 

  const errorDetails = process.env.NODE_ENV !== 'production' 
      ? { name: err.name, stack: err.stack, originalMessage: err.message } 
      : undefined; 
  // Handle validation errors from @escook/express-joi.
  if (err.name === 'ValidationError' && (err.error?.isJoi || Array.isArray(err.details))) {
    statusCode = 400;
    const details = err.details || (err.error && err.error.details);
    if (details && Array.isArray(details) && details.length > 0) {
      const firstError = details[0];
      // Use Joi's message and remove quotes.
      message = firstError.message.replace(/\"/g, "'");
    } else {
      message = 'Validation failed'; // Fallback message.
    }
    // Respond with the determined status code, message, and error details.
    return res.status(statusCode).json(
      error(message, statusCode, errorDetails) // Use message, statusCode, errorDetails
    );
  }

  // Handle Mongoose CastError (e.g., invalid ObjectId format).
  else if (err.name === 'CastError') {
    statusCode = 400;
    message = `Invalid format for field '${err.path}': Value '${err.value}' is not a valid ${err.kind || 'ID'}.`;
    return res.status(statusCode).json(
        error(message, statusCode, errorDetails)
    );
  }

  // Handle Mongoose ValidationError (model validation errors).
  else if (err.name === 'ValidationError' && err.errors) {
    statusCode = 400;
    const firstErrorKey = Object.keys(err.errors)[0];
    message = err.errors[firstErrorKey]?.message || 'Database validation failed';
    return res.status(statusCode).json(
        error(message, statusCode, errorDetails)
    );
  }

  // Handle specific business logic errors (e.g., from user service).
  // These checks are placed before the generic statusCode check because they are more specific.
  else if (err.message === 'User not found') {
    statusCode = 404;
    message = err.message;
    return res.status(statusCode).json(error(message, statusCode, errorDetails));
  }
  else if (err.message === 'Invalid email or password' || err.message === 'Incorrect password' || err.message === 'Authentication required') {
    statusCode = 401;
    message = 'Unauthorized: ' + err.message; 
    return res.status(statusCode).json(error(message, statusCode, errorDetails));
  }
  else if (err.message === 'This email address is already registered') {
    statusCode = 409;
    message = 'Conflict: ' + err.message; 
    return res.status(statusCode).json(error(message, statusCode, errorDetails));
  }
   else if (err.message === 'Your account has been disabled. Please check with Admin.' || err.message === 'Please check your email to activate the account before login.') {
     statusCode = 403; // Set status to Forbidden.
     message = 'Forbidden: ' + err.message; 
     return res.status(statusCode).json(error(message, statusCode, errorDetails));
  }
   else if (err.message === 'Invalid or expired password reset token.') {
     statusCode = 400; // Set status to Bad Request.
     message = err.message;
     return res.status(statusCode).json(error(message, statusCode, errorDetails));
  }
   else if (err.message === 'User associated with this token could not be found.') {
      statusCode = 404; // Set status to Not Found.
      message = err.message;
      return res.status(statusCode).json(error(message, statusCode, errorDetails));
  }

  // Handle other custom errors that have a specific statusCode.
  else if (err.statusCode && Number.isInteger(err.statusCode) && err.statusCode >= 400 && err.statusCode < 600) {
    statusCode = err.statusCode;
    message = err.message; 
    return res.status(statusCode).json(
      error(message, statusCode, errorDetails) 
    );
  }

  // Default handler for Internal Server Errors (500).
  // Respond with the default status code, message, and error details.
  return res.status(statusCode).json( 
    error(message, statusCode, errorDetails) // Use 'Internal Server Error', 500, errorDetails
  );

};

module.exports = errorHandler;