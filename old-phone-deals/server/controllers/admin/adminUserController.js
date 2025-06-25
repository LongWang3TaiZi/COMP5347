const userService = require('../../../server/service/user/userService');
const responseHelper = require('../../utils/responseHelper');
const logger = require('../../../server/config/logger');
const phoneService = require('../../../server/service/phone/phoneService');
/**
 * get user list, support search, filter and pagination
 */
const getUsers = async (req, res) => {
    try {
        logger.info('getting user list with search, filter and pagination');

        // extract query parameters
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const searchTerm = req.query.search;
        const statusFilter = req.query.status;

        // prepare service layer parameters
        const options = {
            page,
            limit,
            search: searchTerm ? {term: searchTerm} : {},
            filter: statusFilter ? {status: statusFilter} : {}
        };

        // call service layer method to get data
        const result = await userService.getUsers(options);

        logger.info('got user list successfully in admin user controller');
        return res.status(200).json(
            responseHelper.success(result, 'Users retrieved successfully')
        );
    } catch (error) {
        logger.error('get user list failed in admin user controller with error in admin user controller: ', error);
        return res.status(500).json(
            responseHelper.error('Failed to get user list in admin user controller with error in admin user controller: ', 500, error)
        );
    }
};

/**
 * delete user by ID
 */
const deleteUser = async (req, res) => {
    try {
        logger.info('deleting user by ID in admin user controller');

        const userId = req.params.id;

        if (!userId) {
            logger.error('user ID is required for deletion in admin user controller');
            return res.status(400).json(
                responseHelper.error('User ID is required', 400)
            );
        }

        // call service layer method to delete user
        const deletedUser = await userService.deleteUserById(userId);

        logger.info(`user with ID: ${userId} deleted successfully in admin user controller`);
        return res.status(200).json(
            responseHelper.success(deletedUser, 'User deleted successfully')
        );
    } catch (error) {
        logger.error(`delete user failed in admin user controller with error: ${error.message}`);

        // Handle specific errors
        if (error.message === 'User not found') {
            return res.status(404).json(
                responseHelper.error('User not found', 404)
            );
        }

        return res.status(500).json(
            responseHelper.error('Failed to delete user', 500, error)
        );
    }
};

/**
 * update user by ID
 */
const updateUser = async (req, res) => {
    try {
        logger.info('updating user by ID in admin user controller');

        const userId = req.params.id;

        if (!userId) {
            logger.error('user ID is required for update in admin user controller');
            return res.status(400).json(
                responseHelper.error('User ID is required', 400)
            );
        }

        // call service layer method to update user
        const updatedUser = await userService.updateUserById(userId, req.body);

        logger.info(`user with ID: ${userId} updated successfully in admin user controller`);
        return res.status(200).json(
            responseHelper.success(updatedUser, 'User updated successfully')
        );
    } catch (error) {
        logger.error(`update user failed in admin user controller with error: ${error.message}`);

        // handle specific errors
        if (error.message === 'User not found') {
            return res.status(404).json(
                responseHelper.error('User not found', 404)
            );
        }

        return res.status(500).json(
            responseHelper.error('Failed to update user', 500, error)
        );
    }
};

const getReviewsByUserId = async (req, res) => {
    try {
        logger.info('getting reviews by user ID in admin user controller');

        const userId = req.params.id;

        if (!userId) {
            logger.error('user ID is required for getting reviews in admin user controller');
        }

        const reviews = await phoneService.getReviewsByUserId(userId);

        logger.info('got reviews by user ID successfully in admin user controller');
        return res.status(200).json(
            responseHelper.success(reviews, 'Reviews retrieved successfully')
        );
    } catch (error) {
        logger.error('get reviews by user ID failed in admin user controller with error: ', error);
        return res.status(500).json(
            responseHelper.error('Failed to get reviews by user ID', 500, error)
        );
    }
};

const getPhoneBySellerId = async (req, res) => {
    try {
        logger.info('getting phone by seller ID in admin user controller');

        const sellerId = req.params.id;

        if (!sellerId) {
            logger.error('seller ID is required for getting phone in admin user controller');
        }

        const phone = await phoneService.getPhoneBySellerId(sellerId);

        logger.info('got phone by seller ID successfully in admin user controller');
        return res.status(200).json(
            responseHelper.success(phone, 'Phone retrieved successfully')
        );
    } catch (error) {
        logger.error('get phone by seller ID failed in admin user controller with error: ', error);
        return res.status(500).json(
            responseHelper.error('Failed to get phone by seller ID', 500, error)
        );
    }
};

module.exports = {
    getUsers,
    deleteUser,
    updateUser,
    getReviewsByUserId,
    getPhoneBySellerId
};