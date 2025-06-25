const phoneService = require('../service/dbInitService');
const responseHelper = require('../utils/responseHelper');
const logger = require('../../server/config/logger');
/**
 * init phone images in the database
 */
const initPhoneImages = async (req, res) => {
    try {
        // call service layer function
        logger.info('initializing phone images');
        const result = await phoneService.initPhoneImagesService();

        // use responseHelper for success response
        logger.info('phone images initialized successfully');
        return res.status(200).json(
            responseHelper.success(result, 'Phone images initialized successfully')
        );
    } catch (error) {
        logger.error('failed to initialize phone images', error);

        // determine appropriate status code based on error
        const statusCode = error.message === 'No phone data found' ? 404 : 500;

        // use responseHelper for error response
        return res.status(statusCode).json(
            responseHelper.error(
                error.message || 'Failed to initialize phone images',
                statusCode,
                error
            )
        );
    }
};

/**
 * initialize database with phone and user data from json files
 */
const initPhoneData = async (req, res) => {
    try {
        // call service layer function
        logger.info('initializing database with phone and user data');
        const result = await phoneService.initPhoneDataService();

        if (result.success) {
            // use responseHelper for success response
            logger.info('database initialized successfully');
            return res.status(200).json(
                responseHelper.success(result, 'Database initialized successfully')
            );
        } else {
            // handle service-level failure
            logger.error('failed to initialize database', result.message);
            return res.status(500).json(
                responseHelper.error(
                    result.message || 'Failed to initialize database',
                    500
                )
            );
        }
    } catch (error) {
        logger.error('failed to initialize database', error);

        // use responseHelper for error response
        return res.status(500).json(
            responseHelper.error(
                error.message || 'Failed to initialize database',
                500,
                error
            )
        );
    }
};

/**
 * initialize admin user with provided details
 */
const initAdminUser = async (req, res) => {
    try {
        // extract admin data from request body
        const adminData = {
            firstname: req.body.firstname,
            lastname: req.body.lastname,
            email: req.body.email,
            password: req.body.password
        };
        
        logger.info('initializing admin user');
        const result = await phoneService.initAdminUserService(adminData);
        
        if (result.success) {
            // use responseHelper for success response
            logger.info('admin user created successfully');
            return res.status(201).json(
                responseHelper.success(
                    { userId: result.userId },
                    'Admin user created successfully',
                    201
                )
            );
        } else {
            // handle service-level failure
            const statusCode = result.message.includes('already registered') ? 409 : 400;
            logger.error(`failed to create admin user: ${result.message}`);
            return res.status(statusCode).json(
                responseHelper.error(
                    result.message,
                    statusCode
                )
            );
        }
    } catch (error) {
        logger.error('failed to create admin user', error);
        
        // use responseHelper for error response
        return res.status(500).json(
            responseHelper.error(
                error.message || 'Failed to create admin user',
                500,
                error
            )
        );
    }
};

module.exports = {
    initPhoneImages,
    initPhoneData,
    initAdminUser
};