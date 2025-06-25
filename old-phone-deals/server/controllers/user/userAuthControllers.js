const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const User = require('../../models/user');
const logger = require('../../config/logger');
const responseHelper = require('../../utils/responseHelper');
const userService = require('../../service/user/userService')

exports.signup = async (req, res) => {
    logger.info('Received user registration request');
    
    try {
        // Extract user data from request body
        const userData = {
            firstname: req.body.firstname,
            lastname: req.body.lastname,
            email: req.body.email,
            password: req.body.password
        };
        
        // Call service function to handle business logic
        const result = await userService.signup(userData);
        
        // Return success response
        return res.status(201).json(
            responseHelper.success(
                {userId: result.userId},
                'Registration successful. Please check your email for verification instructions.',
                201
            )
        );
        
    } catch (err) {
        // Log the error
        logger.error(`Error during user registration: ${err.message}`, { 
            error: err,
            stack: err.stack 
        });
        
        // Determine appropriate status code
        const statusCode = err.statusCode || 500;
        const message = statusCode === 409 
            ? err.message 
            : (statusCode === 500 
                ? 'An unexpected error occurred. Please try again later.' 
                : err.message);
        
        // Return error response
        return res.status(statusCode).json(
            responseHelper.error(message, statusCode, err)
        );
    }
};

/**
* Verifies a user's email address using a token from the query parameter.
* MAKES THE ENDPOINT IDEMPOTENT: Returns success even if the account is already active.
* * @param {import('express').Request} req - Express request object.
* @param {import('express').Response} res - Express response object.
* @returns {Promise<void>} - Sends JSON response.
* * @precondition req.query.token - Must exist and be a non-empty string.
* @precondition JWT Token - Must be valid, unexpired, and contain expected payload structure.
* @precondition User - User corresponding to token must exist in the database.
* * @postcondition (Success - First Time) - User status updated to 'Active', user saved, 200 response sent with success message.
* @postcondition (Success - Already Active) - No change to user status, 200 response sent indicating account already active.
* @postcondition (Failure - Bad Token) - 400 response sent with specific error message.
* @postcondition (Failure - Not Found) - 404 response sent with specific error message.
* @postcondition (Failure - DB Error) - 500 response sent with specific error message.
* * @throws {Error} - Catches unexpected errors and logs them, attempts to send 500.
*/
exports.verifyEmail = async (req, res) => {
   const {token} = req.query;
 
 if (!token) {
   logger.warn('Missing token in verification request');
   return res.status(400).json(responseHelper.error('Missing verification token.', 400)); 
 }
 
 try {
   // Verify JWT token
   const decoded = jwt.verify(token, process.env.JWT_SECRET);

   // Check token type
   if (decoded.type !== 'verify_email') {
     logger.warn('Invalid token type received for email verification', {tokenType: decoded.type});
     return res.status(400).json(responseHelper.error('Invalid verification link.', 400));
   }
   
   const user = await User.findById(decoded.userId);
   
   if (!user) {
     logger.warn('User not found for verification token', {userId: decoded.userId});
     return res.status(404).json(responseHelper.error('User associated with this token not found.', 404));
   }
   
   // IDEMPOTENCY  !!!!
   // If user is ALREADY active, return SUCCESS (200 OK) instead of error
   if (user.status === 'active') {
     logger.info('Verification attempt for already active account - returning success (Idempotency)', {userId: user._id});
     return res.status(200).json(responseHelper.success(null, 'Account already verified and active.', 200)); 
   }
   user.status = 'active';
   res.set('Cache-Control', 'no-store'); 
   res.set('ETag', '');
   try {
     await user.save();
     logger.info('User email verified successfully and status set to active', {userId: user._id});
     return res.status(200).json(responseHelper.success(null, 'Email verification successful. You can now login.', 200));
   } catch (dbError) {
     logger.error('Database error saving user status during verification', {
         userId: user._id,
         error: dbError,
         stack: dbError.stack
     });
     return res.status(500).json(responseHelper.error('Database error updating account status.', 500, dbError));
   }

 } catch (error) {
   if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
     logger.warn('Invalid or expired JWT token received for verification', {errorName: error.name, token});
     return res.status(400).json(responseHelper.error('Invalid or expired verification link.', 400));
   }

   logger.error('Unexpected error during email verification', {error: error, stack: error.stack});
   return res.status(500).json(responseHelper.error('Server error during verification process.', 500, error));
 }
};

exports.login = async (req, res) => {
    logger.info('Received login request');

    try {
        const {email, password} = req.body;
        const isAdminLogin = req.originalUrl.includes('/admin');

        // Call service function to handle login
        const user = await userService.login({email, password});

        // If this is the user login endpoint but user has admin role, reject the login
        if (!isAdminLogin && (user.role === 'admin' || user.role === 'superAdmin')) {
            logger.warn(`Login failed: Admin user attempted to login through user path: ${email}`);
                return res.status(403).json(
                responseHelper.error('admin users must login through the admin login page', 403)
            );
        }

        // Check if user has appropriate role for admin login
        if (isAdminLogin && user.role !== 'admin' && user.role !== 'superAdmin') {
            logger.warn(`Login failed: Non-admin user attempted to login through admin path: ${email}`);
            return res.status(403).json(
                responseHelper.error('you do not have admin privileges', 403)
            );
        }

        // store user info in session
        req.session.user = {
            _id: user._id,
            firstname: user.firstname,
            lastname: user.lastname,
            email: user.email,
            role: user.role
        };

        // explicitly set path for admin sessions (belt and suspenders approach)
        if (isAdminLogin) {
            logger.info('Setting admin session path', {path: '/'});
            req.session.cookie.path = '/';
        }

        logger.info('Login successful', { 
            email,
            isAdminLogin,
            role: user.role,
            sessionID: req.sessionID,
            cookiePath: req.session.cookie.path
        });

        // Create a public user object for frontend use
        const publicUser = {
            _id: user._id,
            firstname: user.firstname,
            lastname: user.lastname,
            email: user.email,
            role: user.role
        };

        return res.status(200).json(
            responseHelper.success({
                user: publicUser
            }, 'Login successful', 200)
        );
    } catch (error) {
        logger.error('Login error:', error);
        const statusCode = error.statusCode || 500;
        return res.status(statusCode).json(
            responseHelper.error(error || 'Server error, please try again later', statusCode, error)
        );
    }
};

// add logout function
exports.logout = async (req, res) => {
    const isAdminLogout = req.originalUrl.includes('/admin');
    logger.info('Logout request received', { 
        sessionID: req.sessionID, 
        isAdminLogout,
        userId: req.session?.user?._id
    });
    
    // destroy the session
    req.session.destroy(err => {
        if (err) {
            logger.error('Error destroying session:', err);
            return res.status(500).json(
                responseHelper.error('Failed to logout', 500, err)
            );
        }
        
        logger.info('User logged out successfully');
        
        // send different cookies based on path to ensure proper cleanup
        if (isAdminLogout) {
            res.clearCookie('admin_sid', {path: '/'});
        } else {
            res.clearCookie('user_sid', {path: '/'});
        }
        
        return res.status(200).json(
            responseHelper.success(null, 'Logout successful', 200)
        );
    });
};

/**
 * check if user is currently authenticated via session
 * returns user data if authenticated, error if not
 * @param {import('express').Request} req - express request object
 * @param {import('express').Response} res - express response object
 * @returns {Promise<void>} - sends JSON response
 */
exports.checkSession = async (req, res) => {
    const isAdminPath = req.originalUrl.includes('/admin');
    logger.info('checking session status', { 
        sessionID: req.sessionID,
        isAdminPath,
        hasUser: !!req.session?.user,
        userRole: req.session?.user?.role || 'none'
    });
    
    if (req.session && req.session.user) {
        // For admin paths, check admin privileges
        if (isAdminPath && req.session.user.role !== 'admin' && req.session.user.role !== 'superAdmin') {
            logger.info('session check: user is authenticated but lacks admin privileges');
            return res.status(200).json(
                responseHelper.success({
                    isAuthenticated: false
                }, 'user has no admin privileges', 200)
            );
        }
        
        // user is authenticated, return user data
        logger.info('session check: user is authenticated', {
            userId: req.session.user._id,
            role: req.session.user.role,
            isAdminPath,
            cookiePath: req.session.cookie.path
        });
        
        return res.status(200).json(
            responseHelper.success({
                isAuthenticated: true,
                user: req.session.user
            }, 'user is authenticated', 200)
        );
    }
    
    // user is not authenticated
    logger.info('session check: no active session found', {isAdminPath});
    
    return res.status(200).json(
        responseHelper.success({
            isAuthenticated: false
        }, 'no active session', 200)
    );
};

/**
 * Handles password reset request by sending a password reset link to the user's email.
 * 
 * @param {import('express').Request} req - Express request object
 * @param {import('express').Response} res - Express response object
 * @returns {Promise<void>} - Sends JSON response
 */
exports.requestPasswordReset = async (req, res) => {
    logger.info('Received request password reset request');

    try {
        const { email } = req.body;

        if (!email) {
            logger.warn('Password reset request received without a valid email');
            return res.status(400).json(responseHelper.error('Valid email is required.', 400)); 
        }

        await userService.handlePasswordResetRequest(email);

        logger.info(`Password reset process initiated for email (if it exists): ${email}`); 
        return res.status(200).json(
            responseHelper.success(
                null,
                "If an account with that email exists, a password reset link has been sent.",
                200
            )
        );

    } catch (error) {
        logger.error(`Error occurred during password reset request for email: ${req.body.email}`, { errorName: error.name });
        next(error);
    }
};

/**
 * Handles the actual password reset process.
 * Expects a valid token in URL params and new password details in the body.
 * @param {import('express').Request} req Express request object
 * @param {import('express').Response} res Express response object
 */
exports.resetPassword = async (req, res) => {
    logger.info('Received request to reset password');

    try {
        const { token } = req.params;

        const { password: newPassword } = req.body;

        if (!token || !newPassword) {
             logger.warn('Reset password request missing token or new password');
             return res.status(400).json(responseHelper.error('Token and new password are required.', 400));
        }

        // all validation will be processed in the Service layer
        await userService.handleResetPassword(token, newPassword);

        logger.info(`Password successfully reset for token (user associated with token)`); 
        return res.status(200).json(
            responseHelper.success(
                null, 
                "Your password has been reset successfully. You can now login with your new password.",
                200
            )
        );

    } catch (error) {
        logger.error(`Error occurred during password reset process for token: ${req.params.token}`, { errorName: error.name }); 
        next(error);
    }
};

/**
 * admin login route that only allows admin and superAdmin roles
 * @param {import('express').Request} req - express request object
 * @param {import('express').Response} res - express response object
 * @returns {Promise<void>} - sends JSON response
 */
exports.adminLogin = async (req, res) => {
    logger.info('Received admin login request');

    try {
        const {email, password} = req.body;

        // Call service function to handle login
        const user = await userService.login({email, password});

        // Check if user has admin role
        if (user.role !== 'admin' && user.role !== 'superAdmin') {
            logger.warn(`Admin login failed: Non-admin user attempted to login: ${email}`);
            return res.status(403).json(
                responseHelper.error('you do not have admin privileges', 403)
            );
        }

        // store user info in session
        req.session.user = {
            _id: user._id,
            firstname: user.firstname,
            lastname: user.lastname,
            email: user.email,
            role: user.role
        };

        // set admin cookie path
        logger.info('Setting admin session path', {path: '/'});
        req.session.cookie.path = '/';

        logger.info('Admin login successful', {
            email,
            role: user.role,
            sessionID: req.sessionID,
            cookiePath: req.session.cookie.path
        });

        // Create a public user object for frontend use
        const publicUser = {
            _id: user._id,
            firstname: user.firstname,
            lastname: user.lastname,
            email: user.email,
            role: user.role
        };

        return res.status(200).json(
            responseHelper.success({
                user: publicUser
            }, 'Admin login successful', 200)
        );
    } catch (error) {
        logger.error('Admin login error:', error);
        const statusCode = error.statusCode || 500;
        return res.status(statusCode).json(
            responseHelper.error(error.message || 'server error, please try again later', statusCode)
        );
    }
};
