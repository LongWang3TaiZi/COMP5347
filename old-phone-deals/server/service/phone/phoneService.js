const Phone = require('../../models/phone');
const logger = require('../../../server/config/logger');
const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');

/**
 * get phones with pagination, search and filtering
 * @param {Object} options - query options
 * @param {Object} options.search - search term for title or brand
 * @param {Object} options.filter - filter conditions
 * @param {String} options.disabled - filter by disabled status
 * @param {Number} options.page - page number
 * @param {Number} options.limit - number of records per page
 * @param {String} options.sortBy - field to sort by
 * @param {String} options.sortOrder - sort order (asc or desc)
 * @returns {Promise<Object>} - return phones data and pagination information
 */
const getPhones = async (options = {}) => {
    try {
        const {
            search = '',
            filter = {},
            disabled,  // disabled parameter
            page = 1,
            limit = 10,
            sortBy = 'createdAt',
            sortOrder = 'desc'
        } = options;

        const skip = (page - 1) * limit;

        // build query conditions
        let query = {};

        // handle search conditions for title or brand
        if (search) {
            const searchRegex = new RegExp(search, 'i');
            query.$or = [
                { title: searchRegex },
                { brand: searchRegex }
            ];
        }

        // handle brand filter
        if (filter.brand) {
            query.brand = new RegExp(filter.brand, 'i');
        }

        // handle stock filter
        if (filter.inStock !== undefined) {
            query.stock = filter.inStock ? { $gt: 0 } : 0;
        }

        // handle disabled filter based on existence of the field
        if (disabled === 'true') {
            // if disabled=true, find phones where disabled field exists
            query.disabled = { $exists: true };
        } else if (disabled === 'false') {
            // if disabled=false, find phones where disabled field does not exist
            query.disabled = { $exists: false };
        }
        // if disabled parameter is not provided, return all phones

        logger.info(`query conditions: ${JSON.stringify(query)}`);

        // prepare sort
        const sort = {};
        sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

        logger.info(`getting phones with search: "${search}", brand filter: "${filter.brand}", 
            inStock filter: ${filter.inStock}, disabled filter: ${disabled}, page: ${page}, limit: ${limit}`);

        // get paginated phone data
        const phones = await Phone.find(query)
            .sort(sort)
            .skip(skip)
            .limit(limit)
            .populate('seller', 'firstname lastname email');

        // get total number of records
        const total = await Phone.countDocuments(query);

        logger.info(`get phones with pagination successfully. found ${total} phones.`);

        return {
            phones,
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(total / limit)
            }
        };
    } catch (error) {
        logger.error('get phones failed in admin phone service with error: ', error);
        throw error;
    }
};

/**
 * get list of all unique phone brands
 * @returns {Promise<Array>} - array of brand names
 */
const getBrandList = async () => {
    try {
        logger.info('getting list of unique phone brands');
        const brands = await Phone.distinct('brand');

        logger.info(`found ${brands.length} unique phone brands`);
        return brands.filter(brand => brand); // filter out null or empty strings
    } catch (error) {
        logger.error('get brand list failed in admin phone service with error: ', error);
        throw error;
    }
};


/**
 * get five phone listings that have the least quantity available
 * (more than 0 quantity and not disabled)
 * @returns {Promise<Array>} - array of phone objects with image and price
 */
const getSoldOutSoonPhones = async () => {
    try {
        // find phones with stock > 0 and not disabled
        // a phone is disabled if it has a 'disabled' field with empty string value
        logger.info('getting five phone listings that have the least quantity available');
        const phones = await Phone.find({
            stock: { $gt: 0 },
            $or: [
                { disabled: { $exists: false } },  // disabled field doesn't exist
            ]

        })
            .sort({ stock: 1 })  // sort by stock in ascending order (least quantity first)
            .limit(5)            // limit to 5 results
            .select('image price stock');  // select only image and price fields
        logger.info(`found ${phones.length} phones with stock > 0 and not disabled`);
        return phones;
    } catch (error) {
        throw error;
    }
};

/**
 * get five phone listings that have the highest average rating
 * (not disabled and at least two ratings given)
 * @returns {Promise<Array>} - array of phone objects with image and averageRating
 */
const getBestSellerPhones = async () => {
    try {
        logger.info('getting five phone listings that have the highest average rating');
        // find phones that aren't disabled and have at least 2 reviews
        const phones = await Phone.aggregate([
            {
                $match: {
                    disabled: { $exists: false } // disabled field doesn't exist
                }
            },
            {
                $addFields: {
                    reviewCount: { $size: '$reviews' }
                }
            },
            {
                $match: {
                    reviewCount: { $gte: 2 } // at least 2 reviews
                }
            },
            {
                $addFields: {
                    averageRating: { $avg: '$reviews.rating' }
                }
            },
            {
                $sort: { averageRating: -1 }  // sort by average rating in descending order
            },
            {
                $limit: 5  // limit to 5 results
            },
            {
                $project: {
                    image: 1,
                    averageRating: 1
                }
            }
        ]);
        logger.info(`found ${phones.length} phones with at least 2 reviews and not disabled`);

        return phones;
    } catch (error) {
        throw error;
    }
};

/**
 * search phones with title and brand filter
 * @param {Object} options - search options
 * @param {String} options.search - search term for title
 * @param {String} options.brand - brand filter
 * @param {Object} options.price - price filter with min and max
 * @param {Number} options.page - page number
 * @param {Number} options.limit - number of records per page
 * @returns {Promise<Object>} - returns phones data, brand list and pagination info
 */
const searchPhones = async (options = {}) => {
    try {
        const {
            search = '',
            brand = '',
            price = {},
            page = 1,
            limit = 10
        } = options;

        const skip = (page - 1) * limit;

        // build query conditions
        let query = {
            disabled: { $exists: false }  // exclude disabled phones
        };

        // handle search across title and brand
        if (search) {
            query.$or = [
                { title: new RegExp(search, 'i') },
                { brand: new RegExp(search, 'i') }
            ];
        }

        // handle brand filter (exact match)
        if (brand) {
            // If we already have search criteria, we need to keep it compatible with brand filter
            query.brand = brand;
        }

        // handle price filter
        if (price.min !== undefined || price.max !== undefined) {
            query.price = {};
            if (price.min !== undefined) {
                query.price.$gte = parseFloat(price.min);
            }
            if (price.max !== undefined) {
                query.price.$lte = parseFloat(price.max);
            }
        }

        logger.info(`searching phones with query: ${JSON.stringify(query)}`);

        // get paginated phone data
        const phones = await Phone.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .populate('seller', 'firstname lastname email');

        // get total number of matching records
        const total = await Phone.countDocuments(query);

        // get all unique brands
        const brands = await Phone.distinct('brand');

        logger.info(`search completed. found ${total} phones matching criteria`);

        return {
            phones,
            brands: brands.filter(b => b), // filter out null or empty strings
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(total / limit)
            }
        };
    } catch (error) {
        logger.error('search phones failed with error: ', error);
        throw error;
    }
};

/**
 * get phone by id
 * @param {String} phoneId - phone id
 * @returns {Promise<Object>} - phone object
 */
const getPhoneById = async (phoneId) => {
    try {
        const phone = await Phone.findById(phoneId)
            .populate('seller', 'firstname lastname email')
            .populate({
                path: 'reviews.reviewer',
                select: 'firstname lastname email',
                model: 'User'
            });
        if (!phone) {
            logger.error(`phone with ID: ${phoneId} not found`);
            const error = new Error('phone not found');
            error.statusCode = 400;
            throw error;
        }
        return phone;
    } catch (error) {
        throw error;
    }
};

/**
 * delete phone by id
 * @param {String} phoneId - phone id
 * @returns {Promise<Object>} - phone object
 */
const deletePhoneById = async (phoneId) => {
    try {
        const phone = await Phone.findByIdAndDelete(phoneId);
        return phone;
    } catch (error) {
        throw error;
    }
};

/**
 * disable phone by id
 * @param {String} phoneId - phone id
 * @returns {Promise<Object>} - phone object
 */
const disablePhoneById = async (phoneId) => {
    try {
        const phone = await Phone.findByIdAndUpdate(
            phoneId, 
            { $set: { disabled: "" } }, 
            { new: true }
        );
        return phone;
    } catch (error) {
        throw error;
    }
};

/**
 * get phone by seller id
 * @param {String} sellerId - seller id
 * @returns {Promise<Object>} - phone object
 */
const getPhoneBySellerId = async (sellerId) => {
    try {
        const phone = await Phone.find({ seller: sellerId });
        return phone;
    } catch (error) {
        throw error;
    }
};  

/**
 * get reviews by user id
 * @param {String} userId - user id
 * @returns {Promise<Object>} - reviews object
 */
const getReviewsByUserId = async (userId) => {
    try {
        const userIdObj = new mongoose.Types.ObjectId(userId);

        const reviews = await Phone.aggregate([
            { $unwind: "$reviews" },
            { $match: { "reviews.reviewer": userIdObj } },
            { $project: {
                phoneId: "$_id",
                brand: "$brand",
                phoneTitle: "$title",
                review: "$reviews"
            }}
        ]);
        
        return reviews;
    } catch (error) {
        if (error.name === 'BSONTypeError' || error.message.includes('ObjectId')) {
            logger.error(`Invalid ObjectId format: ${userId}`);
            return []; 
        }
        throw error;
    }
};

const updatePhoneById = async (phoneId, phone) => {
    try {
        const updatedPhone = await Phone.findByIdAndUpdate(phoneId, phone, { new: true });
        return updatedPhone;
    } catch (error) {
        throw error;
    }
};


const uploadImage = async (image) => {
    try {
        if (!image) {
            throw new Error('Image is required');
        }

        // generate unique ID as file name
        const uuid = uuidv4();
        const imagePath = `/images/${uuid}.jpeg`;
        
        const fullImagePath = path.join(__dirname, '../../public', imagePath);
        
        if (Buffer.isBuffer(image)) {
            fs.writeFileSync(fullImagePath, image);
        } else if (typeof image === 'string') {
            if (image.startsWith('data:image')) {
                const base64Data = image.replace(/^data:image\/\w+;base64,/, '');
                const imageBuffer = Buffer.from(base64Data, 'base64');
                fs.writeFileSync(fullImagePath, imageBuffer);
            } else {
                const fileData = fs.readFileSync(image);
                fs.writeFileSync(fullImagePath, fileData);
            }
        } else {
            throw new Error('Unsupported image data format');
        }
        
        logger.info(`image saved successfully: ${imagePath}`);
        return imagePath;
    } catch (error) {
        logger.error(`image upload failed: ${error.message}`);
        throw error;
    }
};

const getAllReviews = async (page = 1, limit = 10, brand = null, hidden = null) => {
    try {
        
        const skip = (page - 1) * limit;

        const aggregationPipeline = [];
        
        if (brand) {
            aggregationPipeline.push({ 
                $match: { brand: brand } 
            });
        }
        aggregationPipeline.push({ $unwind: "$reviews" });
        
        if (hidden !== null && hidden === true) {
            aggregationPipeline.push({
                $match: { "reviews.hidden": { $exists: true } }
            });
        } else if (hidden !== null && hidden === false) {
            aggregationPipeline.push({
                $match: { "reviews.hidden": { $exists: false } }
            });
        }

        aggregationPipeline.push(
            {
                $lookup: {
                    from: "users",
                    let: { reviewerId: "$reviews.reviewer" },
                    pipeline: [
                        { 
                            $match: { 
                                $expr: { $eq: ["$_id", "$$reviewerId"] } 
                            } 
                        },
                        { 
                            $project: { 
                                _id: 1,
                                firstname: 1, 
                                lastname: 1, 
                                email: 1 
                            } 
                        }
                    ],
                    as: "reviewerInfo"
                }
            },
            {
                $addFields: {
                    "reviews.reviewer": { 
                        $arrayElemAt: ["$reviewerInfo", 0] 
                    }
                }
            },
            {
                $project: {
                    phoneId: "$_id",
                    brand: "$brand",
                    phoneTitle: "$title",
                    review: "$reviews"
                }
            }
        );
        
        const countPipeline = [...aggregationPipeline, { $count: "total" }];
        const countResult = await Phone.aggregate(countPipeline);
        const total = countResult.length > 0 ? countResult[0].total : 0;
        
        const totalPages = Math.ceil(total / limit);
        
        const paginatedPipeline = [
            ...aggregationPipeline,
            { $skip: skip },
            { $limit: limit }
        ];
        
        const reviews = await Phone.aggregate(paginatedPipeline);
        
        return {
            reviews,
            total,
            totalPages
        };
    } catch (error) {
        throw error;
    }
};




const searchReviews = async (query, page = 1, limit = 10, brand = null, hidden = null) => {
    try {
        const skip = (page - 1) * limit;
        const searchRegex = new RegExp(query, 'i'); 
        
        const aggregationPipeline = [];
        
        if (brand) {
            aggregationPipeline.push({ 
                $match: { brand: brand } 
            });
        }
        
        aggregationPipeline.push({ $unwind: "$reviews" });
        
        if (hidden === true) {
            aggregationPipeline.push({
                $match: { "reviews.hidden": { $exists: true } }
            });
        } else if (hidden === false) {
            aggregationPipeline.push({
                $match: { "reviews.hidden": { $exists: false } }
            });
        }
        
        aggregationPipeline.push(
            {
                $lookup: {
                    from: "users",
                    localField: "reviews.reviewer",
                    foreignField: "_id",
                    as: "reviewerInfo"
                }
            },
            {
                $addFields: {
                    "reviewerData": { $arrayElemAt: ["$reviewerInfo", 0] }
                }
            }
        );
        
        if (query) {  
            aggregationPipeline.push({
                $match: {
                    $or: [
                        { "title": searchRegex },
                        { "reviews.comment": searchRegex },
                        { "reviewerData.firstname": searchRegex },
                        { "reviewerData.lastname": searchRegex }
                    ]
                }
            });
        }
        
        aggregationPipeline.push(
            {
                $addFields: {
                    "reviews.reviewer": {
                        _id: "$reviewerData._id",
                        firstname: "$reviewerData.firstname",
                        lastname: "$reviewerData.lastname",
                        email: "$reviewerData.email"
                    }
                }
            },
            {
                $project: {
                    phoneId: "$_id",
                    brand: "$brand",
                    phoneTitle: "$title",
                    review: "$reviews"
                }
            }
        );
        
        aggregationPipeline.push({
            $facet: {
                paginatedResults: [
                    { $skip: skip },
                    { $limit: limit }
                ],
                totalCount: [
                    { $count: "count" }
                ]
            }
        });
        
        const result = await Phone.aggregate(aggregationPipeline);
        
        const reviews = result[0].paginatedResults;
        const total = result[0].totalCount.length > 0 ? result[0].totalCount[0].count : 0;
        const totalPages = Math.ceil(total / limit);
        
        return {
            reviews,
            total,
            totalPages,
            currentPage: page,
            pageSize: limit
        };
    } catch (error) {
        logger.error(`Error searching reviews: ${error.message}`);
        throw error;
    }
};


const hideOrShowReview = async (phoneId, reviewerId, comment, hide) => {
    try {
        let result;

        result = await Phone.findOne(
            {
                _id: phoneId,
                "reviews.reviewer": reviewerId,
                "reviews.comment": comment
            })
        
        if (hide) {
            // Hide review - add hidden field with empty string value
            result = await Phone.findOneAndUpdate(
                {
                    _id: phoneId,
                    "reviews.reviewer": reviewerId,
                    "reviews.comment": comment
                },
                {
                    $set: { "reviews.$.hidden": "" }
                },
                { new: true }
            );
        } else {
            result = await Phone.findOneAndUpdate(
                {
                    _id: phoneId,
                    "reviews.reviewer": reviewerId,
                    "reviews.comment": comment
                },
                {
                    $unset: { "reviews.$.hidden": "" }
                },
                { new: true }
            );
        }

        if (!result) {
            throw new Error('Review not found');
        }

        return result;
    } catch (error) {
        throw error;
    }
};

/**
 * @param {String} phoneId 
 * @param {String} userId 
 * @param {Number} rating 
 * @param {String} comment 
 * @returns {Promise<Object>}
 */
const addReview = async (phoneId, userId, rating, comment) => {
    try {
        const phone = await Phone.findById(phoneId);
        if (!phone) {
            throw new Error('phone not found');
        }
        const newReview = {
            reviewer: userId,
            rating,
            comment,
            createdAt: new Date(),
            updatedAt: new Date(),
        };
        phone.reviews.unshift(newReview);
        await phone.save();
        return phone.reviews[0];
    } catch (error) {
        throw error;
    }
};

module.exports = {
    getPhones,
    getBrandList,
    getSoldOutSoonPhones,
    getBestSellerPhones,
    searchPhones,
    getPhoneById,
    deletePhoneById,
    disablePhoneById,
    getPhoneBySellerId,
    getReviewsByUserId,
    updatePhoneById,
    uploadImage,
    getAllReviews,
    searchReviews,
    hideOrShowReview,
    addReview,
};