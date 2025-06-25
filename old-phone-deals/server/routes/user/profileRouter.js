const express = require('express');
const router = express.Router();
const profileController = require('../../controllers/user/profileController');
const { isAuthenticated } = require('../../middlewares/authMiddleware');
const { profileUpdateSchema } = require('../../validator/profileValidator');
const { changePasswordSchema } = require('../../validator/passwordValidator');
const { listingSchema } = require('../../validator/listingValidator');
const expressjoi = require('@escook/express-joi');

/**
 * @swagger
 * /api/user/profile:
 *   get:
 *     summary: Get current user's profile
 *     description: Return the current user's profile information
 *     tags: [User Profile]
 *     security:
 *       - sessionAuth: []
 *     responses:
 *       '200':
 *         description: Successfully get user information
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 statusCode:
 *                   type: number
 *                   example: 200
 *                 message:
 *                   type: string
 *                   example: "Successfully get user information"
 *                 data:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                     firstname:
 *                       type: string
 *                     lastname:
 *                       type: string
 *                     email:
 *                       type: string
 *       '401':
 *         description: Unauthorized access
 *       '404':
 *         description: User not found
 *       '500':
 *         description: Server error
 */
router.get('/', isAuthenticated, profileController.getUserProfile);

/**
 * @swagger
 * /api/user/profile/update:
 *   put:
 *     summary: Update user profile
 *     description: Update the current user's personal information
 *     tags: [User Profile]
 *     security:
 *       - sessionAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - firstname
 *               - lastname
 *               - email
 *               - password
 *             properties:
 *               firstname:
 *                 type: string
 *               lastname:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 description: Current password, used for verification
 *     responses:
 *       '200':
 *         description: User profile updated successfully
 *       '400':
 *         description: Invalid request data
 *       '401':
 *         description: Password verification failed
 *       '403':
 *         description: Unauthorized operation
 *       '404':
 *         description: User not found
 *       '409':
 *         description: Email already in use
 *       '500':
 *         description: Server error
 */
router.put('/update', isAuthenticated, expressjoi(profileUpdateSchema), profileController.updateUserProfile);

/**
 * @swagger
 * /api/user/profile/change-password:
 *   put:
 *     summary: Change user password
 *     description: Change the current user's password
 *     tags: [User Profile]
 *     security:
 *       - sessionAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - currentPassword
 *               - newPassword
 *             properties:
 *               currentPassword:
 *                 type: string
 *               newPassword:
 *                 type: string
 *     responses:
 *       '200':
 *         description: Password changed successfully
 *       '400':
 *         description: Invalid request data or password too short
 *       '401':
 *         description: Current password is incorrect
 *       '403':
 *         description: Unauthorized operation
 *       '404':
 *         description: User not found
 *       '500':
 *         description: Server error
 */
router.put('/change-password', isAuthenticated, expressjoi(changePasswordSchema), profileController.changePassword);

/**
 * @swagger
 * /api/user/profile/listings:
 *   get:
 *     summary: Get user's phone listings
 *     description: Get all phone listings of the current user
 *     tags: [User Listings]
 *     security:
 *       - sessionAuth: []
 *     responses:
 *       '200':
 *         description: Successfully get phone listings
 *       '403':
 *         description: Unauthorized access
 *       '404':
 *         description: User not found
 *       '500':
 *         description: Server error
 */
router.get('/listings', isAuthenticated, (req, res) => {
  req.params.userId = req.session.user._id;
  profileController.getUserListings(req, res);
});

/**
 * @swagger
 * /api/user/profile/listings:
 *   post:
 *     summary: Add new phone listing
 *     description: Add a new phone listing for the current user
 *     tags: [User Listings]
 *     security:
 *       - sessionAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - brand
 *               - price
 *               - stock
 *             properties:
 *               title:
 *                 type: string
 *               brand:
 *                 type: string
 *               image:
 *                 type: string
 *               price:
 *                 type: number
 *               stock:
 *                 type: number
 *     responses:
 *       '201':
 *         description: Phone listing added successfully
 *       '400':
 *         description: Invalid request data
 *       '500':
 *         description: Server error
 */
router.post('/listings', isAuthenticated, expressjoi(listingSchema), profileController.addPhoneListing);

/**
 * @swagger
 * /api/user/profile/listings/{phoneId}:
 *   put:
 *     summary: Update phone listing
 *     description: Update the information of the current user's phone listing
 *     tags: [User Listings]
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - in: path
 *         name: phoneId
 *         schema:
 *           type: string
 *         required: true
 *         description: Phone ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - brand
 *               - price
 *               - stock
 *             properties:
 *               title:
 *                 type: string
 *               brand:
 *                 type: string
 *               image:
 *                 type: string
 *               price:
 *                 type: number
 *               stock:
 *                 type: number
 *     responses:
 *       '200':
 *         description: Phone listing updated successfully
 *       '400':
 *         description: Invalid request data
 *       '403':
 *         description: Unauthorized operation
 *       '404':
 *         description: Phone listing not found
 *       '500':
 *         description: Server error
 */
router.put('/listings/:phoneId', isAuthenticated, expressjoi(listingSchema), profileController.updatePhoneListing);

/**
 * @swagger
 * /api/user/profile/listings/{phoneId}/status:
 *   put:
 *     summary: Toggle phone listing status
 *     description: Toggle the status of the current user's phone listing
 *     tags: [User Listings]
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - in: path
 *         name: phoneId
 *         schema:
 *           type: string
 *         required: true
 *         description: Phone ID
 *     responses:
 *       '200':
 *         description: Phone listing status updated successfully
 *       '403':
 *         description: Unauthorized operation
 *       '404':
 *         description: Phone listing not found
 *       '500':
 *         description: Server error
 */
router.put('/listings/:phoneId/status', isAuthenticated, profileController.togglePhoneStatus);

/**
 * @swagger
 * /api/user/profile/listings/{phoneId}:
 *   delete:
 *     summary: Delete phone listing
 *     description: Delete the current user's phone listing
 *     tags: [User Listings]
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - in: path
 *         name: phoneId
 *         schema:
 *           type: string
 *         required: true
 *         description: Phone ID
 *     responses:
 *       '200':
 *         description: Phone listing deleted successfully
 *       '403':
 *         description: Unauthorized operation
 *       '404':
 *         description: Phone listing not found
 *       '500':
 *         description: Server error
 */
router.delete('/listings/:phoneId', isAuthenticated, profileController.deletePhoneListing);

/**
 * @swagger
 * /api/user/profile/comments:
 *   get:
 *     summary: Get phone listing comments
 *     description: Get all comments of the current user's phone listing
 *     tags: [User Comments]
 *     security:
 *       - sessionAuth: []
 *     responses:
 *       '200':
 *         description: Successfully get comments
 *       '403':
 *         description: Unauthorized access
 *       '404':
 *         description: User not found
 *       '500':
 *         description: Server error
 */
router.get('/comments', isAuthenticated, (req, res) => {
  req.params.userId = req.session.user._id;
  profileController.getUserListingsComments(req, res);
});

/**
 * @swagger
 * /api/user/profile/comments/visibility:
 *   put:
 *     summary: Toggle comment visibility
 *     description: Toggle the visibility of the current user's phone listing comment. When comment is hidden, it will have a "hidden" field with empty string value; when visible, the "hidden" field will be removed.
 *     tags: [User Comments]
 *     security:
 *       - sessionAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - phoneId
 *               - reviewId
 *               - hide
 *             properties:
 *               phoneId:
 *                 type: string
 *                 description: Phone ID
 *               reviewId:
 *                 type: string
 *                 description: Review ID
 *               hide:
 *                 type: boolean
 *                 description: Whether to hide the review
 *     responses:
 *       '200':
 *         description: Comment visibility updated successfully
 *       '400':
 *         description: Invalid request data
 *       '403':
 *         description: Unauthorized operation
 *       '404':
 *         description: Phone listing or comment not found
 *       '500':
 *         description: Server error
 */
router.put('/comments/visibility', isAuthenticated, profileController.updateCommentVisibility);

/**
 * @swagger
 * /api/user/profile/logout:
 *   post:
 *     summary: Logout
 *     description: Clear user session and logout
 *     tags: [User Auth]
 *     security:
 *       - sessionAuth: []
 *     responses:
 *       '200':
 *         description: Logout successfully
 *       '500':
 *         description: Server error
 */
router.post('/logout', isAuthenticated, (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({
        success: false,
        statusCode: 500,
        message: 'Server error, logout failed'
      });
    }
    
    res.clearCookie('sessionId');
    
    return res.status(200).json({
      success: true,
      statusCode: 200,
      message: 'Logout successfully'
    });
  });
});

// upload image for product listing
router.post('/upload-image', profileController.uploadImage);

module.exports = router; 