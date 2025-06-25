const adminPhoneService = require('../../service/phone/phoneService');
const logger = require('../../../server/config/logger');
const responseHelper = require('../../utils/responseHelper');

/**
 * get all phones with pagination, search and filtering
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} - JSON response with phones data
 */
const getPhones = async (req, res) => {
    try {
        const { page, limit, search, brand, disabled, inStock, sortBy, sortOrder } = req.query;

        const options = {
            page: parseInt(page) || 1,
            limit: parseInt(limit) || 10,
            search,
            disabled, // pass the disabled parameter directly
            filter: {
                brand,
                inStock: inStock === 'true' ? true : inStock === 'false' ? false : undefined
            },
            sortBy,
            sortOrder
        };

        logger.info(`getting phones with options: ${JSON.stringify(options)}`);
        const result = await adminPhoneService.getPhones(options);

        return res.status(200).json(
            responseHelper.success(result, 'phone retrieved successfully')
        );
    } catch (error) {
        logger.error('get phone list failed in admin phone controller with error: ', error);
        return res.status(500).json(
            responseHelper.error('failed to get phone list in admin phone controller', 500, error)
        );
    }
};

/**
 * get list of available brands for filtering
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} - JSON response with brands data
 */
const getAvailableBrands = async (req, res) => {
    try {
        logger.info('getting available phone brands');

        const brands = await adminPhoneService.getBrandList();

        logger.info(`retrieved ${brands.length} available brands`);
        return res.status(200).json(
            responseHelper.success({ brands }, 'brands retrieved successfully')
        );
    } catch (error) {
        logger.error('get available brands failed with error: ', error);
        return res.status(500).json(
            responseHelper.error('failed to get brand list', 500, error)
        );
    }
};

const getPhoneDetailsById = async (req, res) => {
    try {
        const phoneId = req.params.id;
        const phone = await adminPhoneService.getPhoneById(phoneId);
        return res.status(200).json(
            responseHelper.success(phone, 'phone details retrieved successfully')
        );
    } catch (error) {
        logger.error('get phone details failed with error: ', error);
        return res.status(500).json(
            responseHelper.error('failed to get phone details', 500, error)
        );
    }
};

const deletePhoneById = async (req, res) => {
    try {
        const phoneId = req.params.id;
        const phone = await adminPhoneService.deletePhoneById(phoneId);
        return res.status(200).json(
            responseHelper.success('phone deleted successfully')
        );
    } catch (error) {
        logger.error('delete phone failed with error: ', error);
        return res.status(500).json(
            responseHelper.error('failed to delete phone', 500, error)
        );
    }
};

const disablePhoneById = async (req, res) => {
    try {
        const phoneId = req.params.id;
        const phone = await adminPhoneService.disablePhoneById(phoneId);
        return res.status(200).json(
            responseHelper.success('phone disabled successfully')
        );
    } catch (error) {
        logger.error('disable phone failed with error: ', error);
        return res.status(500).json(
            responseHelper.error('failed to disable phone', 500, error)
        );
    }
};

const updatePhoneById = async (req, res) => {
    try {
        const phoneId = req.params.id;
        const phone = req.body;
        const updatedPhone = await adminPhoneService.updatePhoneById(phoneId, phone);   
        return res.status(200).json(
            responseHelper.success(updatedPhone, 'phone updated successfully')
        );
    } catch (error) {
        logger.error('update phone failed with error: ', error);
        return res.status(500).json(
            responseHelper.error('failed to update phone', 500, error)
        );  
    }
};

const uploadImage = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json(
                responseHelper.error('No image file provided', 400)
            );
        }
        
        logger.info(`Received image upload: ${req.file.originalname}, size: ${req.file.size} bytes`);
        
        const imagePath = await adminPhoneService.uploadImage(req.file.buffer);

        logger.info(`image uploaded successfully: ${imagePath}`);
        return res.status(200).json(responseHelper.success(imagePath, 'image uploaded successfully'));
    } catch (error) {
        logger.error('upload image failed with error: ', error.message);
        return res.status(500).json(
            responseHelper.error('failed to upload image', 500, error.message)
        );
    }
};

const getAllReviews = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1; 
        const limit = parseInt(req.query.limit) || 10; 
        const brand = req.query.brand; 
        let hidden = null;
        if (req.query.hidden != null) {
            hidden = req.query.hidden === 'true'; 
        }
        
        const { reviews, total, totalPages } = await adminPhoneService.getAllReviews(page, limit, brand, hidden);
        
        const pagination = {
            total,
            totalPages,
            currentPage: page,
            pageSize: limit,
            hasNext: page < totalPages,
            hasPrev: page > 1
        };
        
        return res.status(200).json(
            responseHelper.success(
                { reviews, pagination }, 
                'reviews retrieved successfully'
            )
        );
    } catch (error) {
        logger.error('get all reviews failed with error: ', error);
        return res.status(500).json(
            responseHelper.error('failed to get all reviews', 500, error)
        );
    }
};

const searchReviews = async (req, res) => {
    try {
        const query = req.query.search || ''; 
        const page = parseInt(req.query.page) || 1; 
        const limit = parseInt(req.query.limit) || 10; 
        const brand = req.query.brand; 
        let hidden = null;
        if (req.query.hidden != null) {
            hidden = req.query.hidden === 'true'; 
        }
        const result = await adminPhoneService.searchReviews(query, page, limit, brand, hidden);
        
        return res.status(200).json(
            responseHelper.success(result, 'Reviews searched successfully')
        );
    } catch (error) {
        logger.error('Search reviews failed with error: ', error);
        return res.status(500).json(
            responseHelper.error('Failed to search reviews', 500, error.message)
        );
    }
};

const hideOrShowReview = async (req, res) => {
    try {
        const { phoneId, reviewerId, comment, hide } = req.body;
        
        if (!phoneId || !comment) {
            return res.status(400).json(
                responseHelper.error('Phone ID and comment are required', 400)
            );
        }
        
        const result = await adminPhoneService.hideOrShowReview(
            phoneId,
            reviewerId,
            comment, 
            hide
        );
        
        return res.status(200).json(
            responseHelper.success(result, `Review ${hide ? 'hidden' : 'shown'} successfully`)
        );
    } catch (error) {
        logger.error('Hide/show review failed with error: ', error);
        return res.status(500).json(
            responseHelper.error('Failed to hide/show review', 500, error.message)
        );
    }
};

module.exports = {
    getPhones,
    getAvailableBrands,
    getPhoneDetailsById,
    deletePhoneById,
    disablePhoneById,
    updatePhoneById,
    uploadImage,
    getAllReviews,
    searchReviews,
    hideOrShowReview
};