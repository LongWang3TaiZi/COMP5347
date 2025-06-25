const bcrypt = require('bcrypt');
const crypto = require('crypto');

const User = require('../../models/user');
const logger = require('../../../server/config/logger');
const { sendVerificationEmail, sendPasswordResetEmail } = require('../emailService');
const moment = require('moment');
const Phone = require('../../models/phone');
const Cart = require('../../models/cart');
const Wishlist = require('../../models/wishlist');
const PasswordResetToken = require('../../models/passwordResetToken');

/**
 * get users
 * @param {Object} options - query options
 * @param {Object} options.search - search conditions
 * @param {Object} options.filter - filter conditions
 * @param {Number} options.page - page number
 * @param {Number} options.limit - number of records per page
 * @returns {Promise<Object>} - return user data and pagination information
 */
const getUsers = async (options = {}) => {
    try {
        const { search = {}, filter = {}, page = 1, limit = 10 } = options;
        const skip = (page - 1) * limit;

        let query = {};

        if (search.term) {
            const escapedTerm = search.term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const searchRegex = new RegExp(escapedTerm, 'i');
            query.$or = [
                { firstname: searchRegex },
                { lastname: searchRegex },
                { email: searchRegex }
            ];
        }

        if (filter.status) {
            query.status = filter.status;
        }

        logger.info(`Getting users with search term: "${search.term}", status filter: "${filter.status}", 
            page: ${page}, limit: ${limit}`);

        const users = await User.find(query)
            .select('-password')
            .skip(skip)
            .limit(limit);

        const total = await User.countDocuments(query);

        logger.info('Get users with pagination successfully in user service');

        return {
            users,
            pagination: {
                total,
                page: page,
                limit: limit,
                totalPages: Math.ceil(total / limit)
            }
        };
    } catch (error) {
        logger.error('Get users failed in user service with error in user service: ', error);
        throw error;
    }
};

/**
 * delete a user by ID
 * @param {String} userId - the ID of the user to delete
 * @returns {Promise<Object>} - the deleted user object
 */
const deleteUserById = async (userId) => {
    try {
        logger.info(`deleting user with ID: ${userId}`);

        logger.info(`Deleting listings for user ID: ${userId}`);
        await Phone.deleteMany({ seller: userId });
        logger.info(`Successfully deleted listings for user ID: ${userId}`);

        logger.info(`Deleting reviews made by user ID: ${userId}`);
        await Phone.updateMany(
            { "reviews.reviewer": userId },
            { $pull: { reviews: { reviewer: userId } } }
        );
        logger.info(`Successfully deleted reviews made by user ID: ${userId}`);

        logger.info(`Deleting cart for user ID: ${userId}`);
        await Cart.deleteMany({ user: userId });
        logger.info(`Successfully deleted cart for user ID: ${userId}`);

        logger.info(`Deleting wishlist for user ID: ${userId}`);
        await Wishlist.deleteMany({ user: userId });
        logger.info(`Successfully deleted wishlist for user ID: ${userId}`);

        logger.info(`Deleting password reset tokens for user ID: ${userId}`);
        await PasswordResetToken.deleteMany({ userId: userId });
        logger.info(`Successfully deleted password reset tokens for user ID: ${userId}`);

        const deletedUser = await User.findByIdAndDelete(userId);

        if (!deletedUser) {
            logger.error(`user with ID: ${userId} not found for deletion`);
            throw new Error('User not found');
        }

        logger.info(`user with ID: ${userId} deleted successfully`);
        return deletedUser;
    } catch (error) {
        logger.error(`delete user failed for ID: ${userId} with error: ${error.message}`);
        throw error;
    }
};


/**
 * update a user by ID
 * @param {String} userId - the ID of the user to update
 * @param {Object} updateData - object containing fields to update (firstname, lastname, email)
 * @returns {Promise<Object>} - the updated user object
 */
const updateUserById = async (userId, updateData) => {
    try {
        logger.info(`Updating user with ID: ${userId}`);

        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { $set: updateData },
            { new: true }  // return the updated document
        ).select('-password');

        if (!updatedUser) {
            logger.error(`user with ID: ${userId} not found for update`);
            throw new Error('User not found');
        }

        logger.info(`user with ID: ${userId} updated successfully`);
        return updatedUser;
    } catch (error) {
        logger.error(`update user failed for ID: ${userId} with error: ${error.message}`);
        throw error;
    }
};

/**
 * signup a new user
 * @param {Object} userData - user registration data
 * @param {String} userData.firstname - user's first name
 * @param {String} userData.lastname - user's last name
 * @param {String} userData.email - user's email address
 * @param {String} userData.password - user's password
 * @returns {Promise<Object>} - the created user object
 */
const signup = async (userData) => {
    logger.info('Starting user signup process in service');

    const { firstname, lastname, email, password } = userData;

    const normalizedEmail = email.toLowerCase();
    logger.debug(`Checking if email already exists: ${normalizedEmail}`);

    const existingUser = await User.findOne({ email: normalizedEmail });

    if (existingUser) {
        logger.info(`Signup failed: Email already exists: ${normalizedEmail}`);
        const error = new Error('This email address is already registered');
        error.statusCode = 409;
        throw error;
    }

    logger.debug('Hashing user password');
    const hashedPassword = await bcrypt.hash(password, 12);

    logger.debug('Creating new user record');
    const newUser = new User({
        firstname,
        lastname,
        email: normalizedEmail,
        password: hashedPassword,
        status: 'pending'
    });

    await newUser.save();
    logger.info(`User successfully registered: ${normalizedEmail}`);

    // send verification email
    await sendVerificationEmail(newUser);

    return {
        userId: newUser._id,
        email: newUser.email,
        status: newUser.status
    };
};

/**
 * Login user and update last login time
 * @param {Object} loginData - login credentials
 * @param {String} loginData.email - user's email
 * @param {String} loginData.password - user's password
 * @returns {Promise<Object>} - user data and token
 */
const login = async (loginData) => {
    logger.info('Starting user login process in service');

    const { email, password } = loginData;
    const normalizedEmail = email.toLowerCase();

    // Find user
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
        logger.warn(`Login failed: User not found with email: ${normalizedEmail}`);
        const error = new Error('Invalid email or password');
        error.statusCode = 200;
        throw error;
    }

    // Check user status
    if (user.status === 'inactive') {
        logger.warn(`Login failed: Account inactive for email: ${normalizedEmail}`);
        const error = new Error('Your account has been disabled. Please check with Admin.');
        error.statusCode = 200;
        throw error;
    }

    if (user.status === 'pending') {
        logger.warn(`Login failed: Account pending for email: ${normalizedEmail}`);
        const error = new Error('Please check your email to activate the account before login.');
        error.statusCode = 200;
        throw error;
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
        logger.warn(`Login failed: Invalid password for email: ${normalizedEmail}`);
        const error = new Error('Incorrect password');
        error.statusCode = 200;
        throw error;
    }

    // Update last login time
    user.lastLoginTime = moment().format('YYYY-MM-DD HH:mm');
    await user.save();

    logger.info(`User successfully logged in: ${normalizedEmail}`);

    // Convert user document to a plain JavaScript object
    const userObject = user.toObject();

    // Remove sensitive information
    delete userObject.password;

    return userObject; // Return complete user object without password
};


//Read from environment variables or use default values
const tokenBytes = parseInt(process.env.PASSWORD_RESET_TOKEN_BYTES, 10) || 32; 
const tokenExpiryMs = parseInt(process.env.PASSWORD_RESET_TOKEN_EXPIRY_MS, 10) || 3600000;
/**
 * Handles the logic for initiating a password reset request.
 * Finds the user, generates a reset token, saves it with expiry to the user record,
 * and triggers sending the password reset email.
 * @param {string} email - The email address provided by the user.
 * @returns {Promise<void>} - Returns nothing, handles logic internally. Controller always sends fixed response.
 * @throws {Error} - Throws errors for logging in controller, but doesn't change the user-facing outcome from controller.
 */
const handlePasswordResetRequest = async (email) => {
    logger.info(`Initiating password reset process for email: ${email}`);
    const normalizedEmail = email.toLowerCase();

    try {
        const user = await User.findOne({ email: normalizedEmail });

        if (!user) {
            //DO NOTHING ~~~
            logger.warn(`Password reset requested for non-existent email: ${normalizedEmail}`);
            return; 
        }
        if (user.status !== 'active') {
             logger.warn(`Password reset requested for inactive/pending user: ${normalizedEmail}, Status: ${user.status}`);
             return; //DO NOTHING ~~~
        }

        // generate reset token
        const resetToken = crypto.randomBytes(tokenBytes).toString('hex');
        const resetTokenExpiry = Date.now() + tokenExpiryMs; 

        try {
            await PasswordResetToken.deleteMany({ userId: user._id });
            logger.info(`Removed previous reset tokens for user: ${user._id}`);
        } catch (deleteError) {
             logger.error(`Error deleting previous reset tokens for user ${user._id}: ${deleteError.message}`, { error: deleteError });
        }

        const newTokenRecord = new PasswordResetToken({
            userId: user._id,
            token: resetToken,
            expiresAt: new Date(resetTokenExpiry)
        });
        await newTokenRecord.save();
        logger.info(`Saved new password reset token record for user: ${user._id}`);


        await sendPasswordResetEmail(user, resetToken);
        logger.info(`Password reset email dispatch initiated for: ${normalizedEmail}`);

    } catch (error) {
        logger.error(`Error during handlePasswordResetRequest for email ${normalizedEmail}: ${error.message}`, { error: error, stack: error.stack });
        throw error; 
    }
};


// Attention: read from environment variables or use default values
const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS, 10) || 12;
/**
 * Handles the core logic for resetting a user's password using a valid token.
 * @param {string} token - The password reset token from the URL.
 * @param {string} newPassword - The new password provided by the user.
 * @returns {Promise<void>} - Resolves if successful, throws error otherwise.
 * @throws {Error} - Throws errors with messages and potentially status codes for invalid token, user not found, etc.
 */
const handleResetPassword = async (token, newPassword) => {
    logger.info(`Attempting to reset password with token: ${token}`); 

    try {
        logger.debug(`Finding password reset token record for token: ${token}`);
        const tokenRecord = await PasswordResetToken.findOne({ token: token });

        // if not existed
        if (!tokenRecord) {
            logger.warn(`Password reset failed: Token not found - ${token}`);
            const error = new Error('Invalid or expired password reset token.');
            error.statusCode = 400;
            throw error;
        }
        logger.debug(`Found token record: ${tokenRecord?._id}`);

        // if expired
        if (tokenRecord.expiresAt < Date.now()) {
            logger.warn(`Password reset failed: Token expired - ${tokenRecord._id}`);
            const error = new Error('Invalid or expired password reset token.');
            error.statusCode = 400;
            throw error;
        }
        logger.debug(`Token is valid and not expired: ${tokenRecord._id}`);

        const user = await User.findById(tokenRecord.userId);

        //if-guard
        if (!user) {
            logger.error(`Password reset failed: User not found for valid token - TokenID: ${tokenRecord._id}, UserID: ${tokenRecord.userId}`);
            const error = new Error('User associated with this token could not be found.');
            error.statusCode = 404;
            throw error;
        }
        logger.debug(`Found user for password reset: ${user._id}`);

        const hashedPassword = await bcrypt.hash(newPassword, saltRounds);
        logger.debug(`New password hashed for user: ${user._id}`);
        //update the password
        user.password = hashedPassword;
        await user.save();
        logger.info(`Password successfully updated for user: ${user._id}`);

        await PasswordResetToken.deleteOne({ _id: tokenRecord._id });
        logger.info(`Password reset token record deleted: ${tokenRecord._id}`);
        logger.info(`Password reset process completed successfully for user: ${user._id}`);
        return;

    } catch (error) {
        logger.error(`Error in handleResetPassword service: ${error.message}`, { error: error, stack: error.stack });
        throw error;
    }
};


module.exports = {
    getUsers,
    deleteUserById,
    updateUserById,
    signup,
    login,
    handlePasswordResetRequest,
    handleResetPassword
};

