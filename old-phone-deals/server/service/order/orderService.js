const Order = require('../../models/order');
const logger = require('../../config/logger');
const { parse } = require('json2csv');



const getAllOrders = async ({ filters = {}, skip, limit, sortBy, order }) => {
    try {
        const sortOptions = {};
        sortOptions[sortBy] = order;

        const orders = await Order.find(filters)
            .sort(sortOptions)
            .skip(skip)
            .limit(limit)
            .populate('user', 'firstname lastname email')
            .populate('items.phone', 'name brand price image title');

        const total = await Order.countDocuments(filters);

        return {
            orders,
            total
        };
    } catch (error) {
        logger.error(`Error fetching all orders: ${error.message}`);
        throw new Error('Failed to fetch orders');
    }
};

const exportOrders = async ({ format }) => {
    try {
        // Get all orders
        const orders = await Order.find()
            .populate('user', 'firstname lastname')
            .populate('items.phone', 'title brand price')
            .sort({ createdAt: -1 });

        // Transform data to required format
        const exportData = orders.map(order => ({
            timestamp: order.createdAt,
            buyerName: `${order.user.firstname} ${order.user.lastname}`,
            itemsPurchased: order.items.map(item => `${item.phone.title} x ${item.quantity} ${item.phone.brand} Price: $ ${item.price}`).join(' ｜ '),
            totalAmount: order.totalAmount
        }));

        if (format === 'csv') {
            // Convert to CSV
            const fields = [
                { label: 'Timestamp', value: 'timestamp' },
                { label: 'Buyer name', value: 'buyerName' },
                { label: 'Items purchased and quantities', value: 'itemsPurchased' },
                { label: 'Total amount', value: 'totalAmount' }
            ];
            
            return parse(exportData, { fields });
        } else {
            // Return JSON format
            return exportData.map(item => ({
                'Timestamp': item.timestamp,
                'Buyer name': item.buyerName,
                'Items purchased and quantities': item.itemsPurchased,
                'Total amount': item.totalAmount
            }));
        }
    } catch (error) {
        logger.error(`Error exporting orders: ${error.message}`);
        throw new Error('Failed to export orders');
    }
};


module.exports = {
    getAllOrders,
    exportOrders
};