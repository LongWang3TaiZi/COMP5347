const mongoose = require('mongoose');
require('dotenv').config(); // user environment variables
const logger = require('../config/logger').child({module: 'db'});

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });

        logger.info(`MongoDB connection successfully: ${conn.connection.host}`);
        return conn;
    } catch (error) {
        logger.error(`MongoDB connection failed: ${error.message}`);
        process.exit(1); // exit
    }
};

module.exports = connectDB;