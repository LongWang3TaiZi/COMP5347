const logger = require('../../../server/config/logger');
const phoneService = require('../../service/phone/phoneService');
const responseHelper = require('../../../server/utils/responseHelper');

/**
 * get phones that are about to sell out (lowest stock but still available)
 */
const getSoldOutSoonPhones = async (req, res) => {
    try {
        
        const phones = await phoneService.getSoldOutSoonPhones();
        return res.status(200).json({
            success: true,
            count: phones.length,
            data: phones
        });
    } catch (error) {
        logger.error('Error in getSoldOutSoonPhones:', error);
        return res.status(500).json({
            success: false,
            message: 'Error fetching sold out soon phones',
            error: error.message
        });
    }
};

/**
 * get best-selling phones based on highest average ratings
 */
const getBestSellerPhones = async (req, res) => {
    try {
        const phones = await phoneService.getBestSellerPhones();

        return res.status(200).json({
            success: true,
            count: phones.length,
            data: phones
        });
    } catch (error) {
        logger.error('Error in getBestSellerPhones:', error);

        return res.status(500).json({
            success: false,
            message: 'Error fetching best seller phones',
            error: error.message
        });
    }
};

const searchPhones = async (req, res) => {
    try {
        const { search, brand, minPrice, maxPrice, page, limit } = req.query;

        // prepare price filter if price range is provided
        const priceFilter = {};
        if (minPrice !== undefined) {
            priceFilter.min = parseFloat(minPrice);
        }
        if (maxPrice !== undefined) {
            priceFilter.max = parseFloat(maxPrice);
        }

        const searchOptions = {
            search,
            brand,
            price: priceFilter,
            page: parseInt(page) || 1,
            limit: parseInt(limit) || 10
        };

        const result = await phoneService.searchPhones(searchOptions);

        return res.status(200).json(
            responseHelper.success(result, 'Phones retrieved successfully')
        );
    } catch (error) {
        logger.error('Error in searchPhones:', error);
        return res.status(500).json(
            responseHelper.error('Error searching phones', 500, error.message)
        );
    }
};

const getPhoneById = async (req, res) => {
    try {
        const phoneId = req.params.id;
        if (!phoneId) {
            return res.status(400).json(
                responseHelper.error('Phone ID is required', 400)
            );
        }

        const phone = await phoneService.getPhoneById(phoneId);
        if (!phone) {
            return res.status(404).json(
                responseHelper.error('Phone not found', 404)
            );
        }

        return res.status(200).json(
            responseHelper.success(phone, 'Phone retrieved successfully')
        );
    } catch (error) {
        logger.error('Error in getPhoneById:', error);
        return res.status(500).json(
            responseHelper.error('Error fetching phone by ID', 500, error.message)
        );
    }
};

/**
 * add a review to a phone
 */
const addReview = async (req, res) => {
    try {
        const phoneId = req.params.id;
        const { rating, comment } = req.body;
        const user = req.session && req.session.user;

        if (!user) {
            return res.status(401).json({ success: false, message: '请先登录后再发表评论' });
        }
        if (!rating || !comment) {
            return res.status(400).json({ success: false, message: '评分和评论内容不能为空' });
        }

        const newReview = await phoneService.addReview(phoneId, user._id, rating, comment);
        return res.status(200).json({ success: true, data: newReview });
    } catch (error) {
        logger.error('Error in addReview:', error);
        return res.status(500).json({ success: false, message: '添加评论失败', error: error.message });
    }
};

module.exports = {
    getSoldOutSoonPhones,
    getBestSellerPhones,
    searchPhones,
    getPhoneById,
    addReview,
};