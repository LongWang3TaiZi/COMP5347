const logger = require('../../../server/config/logger');
const responseHelper = require('../../utils/responseHelper');
const orderService = require('../../service/order/orderService');


const getAllOrders = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;  
        const limit = parseInt(req.query.limit) || 10;  
        const sortBy = req.query.sortBy || 'createdAt';  
        const order = req.query.order === 'asc' ? 1 : -1; 

        const skip = (page - 1) * limit;

        // handle date filters
        const filters = {};
        if (req.query.startDate || req.query.endDate) {
            filters.createdAt = {};
            
            if (req.query.startDate) {
                const startDate = new Date(req.query.startDate);
                startDate.setHours(0, 0, 0, 0); // set to start of day
                filters.createdAt.$gte = startDate;
            }
            
            if (req.query.endDate) {
                const endDate = new Date(req.query.endDate);
                endDate.setHours(23, 59, 59, 999); // set to end of day
                filters.createdAt.$lte = endDate;
            }
        }

        const result = await orderService.getAllOrders({
            filters,
            skip,
            limit,
            sortBy,
            order
        });

        return res.status(200).json(responseHelper.success({
            orders: result.orders,
            pagination: {
                currentPage: page,
                pageSize: limit,
                totalItems: result.total,
                totalPages: Math.ceil(result.total / limit),
                hasNextPage: page < Math.ceil(result.total / limit),
                hasPrevPage: page > 1
            }
        }, 'Orders fetched successfully'));
    } catch (error) {
        logger.error(`Error fetching all orders: ${error.message}`);
        return res.status(500).json(responseHelper.error(error.message));
    }
};

const exportOrders = async (req, res) => {
    try {
        const format = req.query.format || 'csv'; // csv or json
        
        // Get data
        const result = await orderService.exportOrders({ format });

        // Set response headers
        if (format === 'csv') {
            res.setHeader('Content-Type', 'text/csv;charset=utf-8');
            res.setHeader('Content-Disposition', `attachment; filename=sales_report_${new Date().toISOString().split('T')[0]}.csv`);
            res.send('\uFEFF' + result); // BOM for UTF-8
        } else {
            res.setHeader('Content-Type', 'application/json');
            res.setHeader('Content-Disposition', `attachment; filename=sales_report_${new Date().toISOString().split('T')[0]}.json`);
            res.json(result);
        }
    } catch (error) {
        logger.error(`Error exporting orders: ${error.message}`);
        return res.status(500).json(responseHelper.error(error.message));
    }
};

module.exports = {
    getAllOrders,
    exportOrders
};