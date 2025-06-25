const logger = require('../config/logger');
const responseHelper = require('../utils/responseHelper');

/**
 * middleware to check if user is authenticated
 * @param {import('express').Request} req - express request object
 * @param {import('express').Response} res - express response object
 * @param {import('express').NextFunction} next - express next function
 */
const isAuthenticated = (req, res, next) => {
    // skip authentication for login, registration and other public routes
    if (req.path === '/login' || req.path === '/register' || 
        req.path === '/signup' || req.path === '/verify' || 
        req.path === '/check-session') {
        return next();
    }
    
    // check if user is authenticated via session
    if (req.session && req.session.user) {
        // user is authenticated, continue to next middleware or route handler
        return next();
    }
    
    // log unauthorized access attempt
    logger.warn('unauthorized access attempt');
    
    // user is not authenticated, send 401 response
    return res.status(401).json(
        responseHelper.error('unauthorized. please login to access this resource', 401)
    );
};

/**
 * middleware to check if user has admin privileges
 * @param {import('express').Request} req - express request object
 * @param {import('express').Response} res - express response object
 * @param {import('express').NextFunction} next - express next function
 */
const isAdmin = (req, res, next) => {
    // skip authentication for check-session and login routes
    if (req.path === '/check-session' || req.path === '/login') {
        return next();
    }
    
    // check if session exists
    if (!req.session || !req.session.user) {
        const sessionDetails = {
            path: req.originalUrl,
            sessionID: req.sessionID || 'no-id',
            hasSession: !!req.session,
            hasUser: !!(req.session && req.session.user),
            method: req.method
        };
        
        logger.warn('admin access attempt with no session', sessionDetails);
        
        return res.status(401).json({
            success: false,
            message: 'session_expired',
            redirectTo: '/admin/login'
        });
    }
    
    // check if user has admin role
    if (req.session.user.role !== 'admin' && req.session.user.role !== 'superAdmin') {
        const userDetails = {
            path: req.originalUrl,
            userId: req.session.user._id,
            role: req.session.user.role,
            method: req.method
        };
        
        logger.warn('unauthorized admin access attempt', userDetails);
        
        return res.status(403).json(
            responseHelper.error('admin privileges required', 403)
        );
    }
    
    logger.info('admin access authorized', {
        userId: req.session.user._id,
        role: req.session.user.role,
        path: req.originalUrl
    });
    
    next();
};

/**
 * Middleware to check if the logged-in user is the owner of the resource
 * (identified by :userId in route params) or is an admin/superAdmin.
 * Assumes isAuthenticated has already run and req.session.user exists.
 * @param {import('express').Request} req - Express request object
 * @param {import('express').Response} res - Express response object
 * @param {import('express').NextFunction} next - Express next function
 */
const isOwnerOrAdmin = (req, res, next) => {
    try {
        const targetUserId = req.params.userId;
        const loggedInUser = req.session.user;


        if (!loggedInUser || !loggedInUser._id) {
             logger.warn('isOwnerOrAdmin check failed: No logged-in user found in session.');
             const err = new Error('Authentication required.');
             err.statusCode = 401;
             return next(err);
        }

        const isOwner = loggedInUser._id.toString() === targetUserId;
        const isAdmin = loggedInUser.role === 'admin' || loggedInUser.role === 'superAdmin';


        if (isOwner || isAdmin) { 
            logger.info(`Authorization successful for user ${loggedInUser._id} accessing resource for ${targetUserId}`);
            next();
        } else {
            logger.warn(`Authorization failed: User ${loggedInUser._id} (role: ${loggedInUser.role}) attempting to access resource for ${targetUserId}`);
            const err = new Error('Forbidden: You do not have permission to access this resource.');
            err.statusCode = 403; // Forbidden
            next(err);
        }
    } catch (error) {
         logger.error('Error in isOwnerOrAdmin middleware:', error);
         next(error);
    }
};

module.exports = {
    isAuthenticated,
    isAdmin,
    isOwnerOrAdmin
}; 