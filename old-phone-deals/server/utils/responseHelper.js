/**
 * common response utility functions
 * provides unified API response format with Swagger documentation
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     SuccessResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *           description: Indicates successful operation
 *         statusCode:
 *           type: integer
 *           example: 200
 *           description: HTTP status code
 *         message:
 *           type: string
 *           example: Operation completed successfully
 *           description: Human-readable success message
 *         data:
 *           type: object
 *           description: Response payload data
 *       required:
 *         - success
 *         - statusCode
 *         - message
 */

/**
 * create success response
 * @param {any} data - response data
 * @param {string} message - success message
 * @param {number} statusCode - HTTP status code
 * @returns {Object} - standard response object
 */
const success = (data = null, message = 'operation success', statusCode = 200) => {
    return {
        success: true,
        statusCode,
        message,
        data
    };
};

/**
 * @swagger
 * components:
 *   schemas:
 *     ErrorResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: false
 *           description: Indicates failed operation
 *         statusCode:
 *           type: integer
 *           example: 400
 *           description: HTTP status code
 *         message:
 *           type: string
 *           example: Operation failed
 *           description: Human-readable error message
 *         error:
 *           type: string
 *           description: Detailed error information (only in non-production)
 *       required:
 *         - success
 *         - statusCode
 *         - message
 */

/**
 * create error response
 * @param {string} message - error message
 * @param {number} statusCode - HTTP status code
 * @param {any} error - error details (optional)
 * @returns {Object} - standard error response object
 */
const error = (message = 'operation failed', statusCode = 400, error = null) => {
    const response = {
        success: false,
        statusCode,
        message
    };

    if (error) {
        response.error = process.env.NODE_ENV === 'production'
            ? 'server internal error'
            : error.toString();
    }

    return response;
};

module.exports = {
    success,
    error
};