const Phone = require('../models/phone');
const User = require('../models/user');
const path = require('path');
const fs = require('fs');
const logger = require('../../server/config/logger');
const bcrypt = require('bcrypt');

// TODO add common response model
// phone images initialization service
const initPhoneImagesService = async () => {
    // query all phone data
    logger.info('initializing phone images in init phone images service');
    const phones = await Phone.find({});

    if (!phones || phones.length === 0) {
        logger.error('No phone data found in init phone images service');
        throw new Error('No phone data found');
    }

    const results = [];

    // update each phone's image field
    for (const phone of phones) {
        const brand = phone.brand;
        if (!brand) {
            results.push({
                id: phone._id,
                status: 'failed',
                message: 'Missing brand field'
            });
            continue;
        }

        // build image path - relative to app's public directory
        const imagePath = `/images/${brand}.jpeg`;

        // check if image exists
        const fullImagePath = path.join(__dirname, '../public', imagePath);

        if (!fs.existsSync(fullImagePath)) {
            results.push({
                id: phone._id,
                brand,
                status: 'failed',
                message: `Image does not exist: ${brand}.jpeg`
            });
            continue;
        }

        // update phone data
        logger.info('updating phone data in init phone images service');
        await Phone.findByIdAndUpdate(phone._id, {image: imagePath});

        results.push({
            id: phone._id,
            brand,
            status: 'success',
            imagePath
        });
    }

    return {
        success: true,
        message: 'Phone images initialized',
        updated: results.filter(r => r.status === 'success').length,
        failed: results.filter(r => r.status === 'failed').length,
        results
    };
};

/**
 * initialize database with phone and user data from json files
 * @returns {Promise<Object>} result of initialization
 */
const initPhoneDataService = async () => {
    logger.info('initializing database with phone and user data');
    
    try {
        // define paths to data files
        const phoneDataPath = path.join(__dirname, '../public/dataset/phonelisting.json');
        const userDataPath = path.join(__dirname, '../public/dataset/userlist.json');
        
        // check if data files exist
        if (!fs.existsSync(phoneDataPath)) {
            logger.error('Phone data file not found');
            throw new Error('Phone data file not found');
        }
        
        if (!fs.existsSync(userDataPath)) {
            logger.error('User data file not found');
            throw new Error('User data file not found');
        }
        
        // read data from files
        const phoneData = JSON.parse(fs.readFileSync(phoneDataPath, 'utf8'));
        const userData = JSON.parse(fs.readFileSync(userDataPath, 'utf8'));
        
        logger.info(`Found ${phoneData.length} phones and ${userData.length} users in data files`);
        
        // initialize counters
        const results = {
            users: { created: 0, failed: 0 },
            phones: { created: 0, failed: 0 }
        };
        
        // import users first
        logger.info('importing users...');
        
        // set default password for all users
        const defaultPassword = '$2b$12$n9p/k0wMUDjmSITFCgWXVu017GUItEgHcqU.AB/tkSJOoyCeXfyaW';
        
        // process each user
        for (const user of userData) {
            try {
                // convert MongoDB ObjectId format to string
                const userId = user._id.$oid;
                
                // check if user already exists
                const existingUser = await User.findById(userId);
                if (existingUser) {
                    logger.info(`User ${userId} already exists, skipping`);
                    continue;
                }
                
                // create new user with the same _id
                await User.create({
                    _id: userId,
                    firstname: user.firstname,
                    lastname: user.lastname,
                    email: user.email,
                    password: defaultPassword,
                    status: 'active',
                    role: 'user'
                });
                
                results.users.created++;
            } catch (error) {
                logger.error(`Failed to import user: ${error.message}`);
                results.users.failed++;
            }
        }
        
        // import phones
        logger.info('importing phones...');
        
        // process each phone
        for (const phone of phoneData) {
            try {
                // create new phone
                const newPhone = {
                    title: phone.title,
                    brand: phone.brand,
                    image: phone.image,
                    stock: phone.stock,
                    seller: phone.seller,
                    price: phone.price,
                    status: 'available',
                    reviews: []
                };
                
                // process reviews if they exist
                if (phone.reviews && Array.isArray(phone.reviews)) {
                    for (const review of phone.reviews) {
                        const reviewObj = {
                            reviewer: review.reviewer,
                            rating: review.rating,
                            comment: review.comment
                        };
                        
                        // add hidden field if it exists
                        if ('hidden' in review) {
                            reviewObj.hidden = review.hidden;
                        }
                        
                        newPhone.reviews.push(reviewObj);
                    }
                }
                
                // save phone to database
                await Phone.create(newPhone);
                results.phones.created++;
            } catch (error) {
                logger.error(`Failed to import phone: ${error.message}`);
                results.phones.failed++;
            }
        }
        
        logger.info('Database initialization completed');
        return {
            success: true,
            message: 'Database initialized successfully',
            users: results.users,
            phones: results.phones
        };
        
    } catch (error) {
        logger.error(`Database initialization failed: ${error.message}`);
        return {
            success: false,
            message: `Database initialization failed: ${error.message}`
        };
    }
};

/**
 * initialize admin user with provided details
 * @param {Object} adminData - admin user data
 * @param {String} adminData.firstname - admin's first name
 * @param {String} adminData.lastname - admin's last name
 * @param {String} adminData.email - admin's email
 * @param {String} adminData.password - admin's password
 * @returns {Promise<Object>} result of admin user creation
 */
const initAdminUserService = async (adminData) => {
    logger.info('initializing admin user');
    
    try {
        const { firstname, lastname, email, password } = adminData;
        
        if (!firstname || !lastname || !email || !password) {
            logger.error('Missing required fields for admin user creation');
            return {
                success: false,
                message: 'Missing required fields for admin user creation'
            };
        }
        
        const normalizedEmail = email.toLowerCase();
        
        // check if user with this email already exists
        const existingUser = await User.findOne({ email: normalizedEmail });
        
        if (existingUser) {
            logger.warn(`Admin creation failed: Email already exists: ${normalizedEmail}`);
            return {
                success: false,
                message: 'This email address is already registered'
            };
        }
        
        // hash the password using bcrypt with salt rounds of 12
        const saltRounds = 12;
        const hashedPassword = await bcrypt.hash(password, saltRounds);
        
        // create new admin user
        const newAdmin = new User({
            firstname,
            lastname,
            email: normalizedEmail,
            password: hashedPassword,
            status: 'active',
            role: 'superAdmin'
        });
        
        await newAdmin.save();
        logger.info(`Admin user successfully created: ${normalizedEmail}`);
        
        return {
            success: true,
            message: 'Admin user created successfully',
            userId: newAdmin._id
        };
        
    } catch (error) {
        logger.error(`Admin user creation failed: ${error.message}`);
        return {
            success: false,
            message: `Admin user creation failed: ${error.message}`
        };
    }
};

module.exports = {
    initPhoneImagesService,
    initPhoneDataService,
    initAdminUserService
};