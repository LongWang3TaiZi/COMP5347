const express = require('express')
const router = express.Router()
const userAuthControllers = require('../../controllers/user/userAuthControllers')
const expressjoi = require('@escook/express-joi')
const {signupSchema} = require('../../validator/userRegisterValidator')
const {loginSchema} = require('../../validator/userLoginValidator')
const { validateLogin } = require('../../validator/userLoginValidator')
const { isAuthenticated } = require('../../middlewares/authMiddleware')
const { requestResetSchema, performResetSchema } = require('../../validator/userResetPasswordValidator');

/**
 * @swagger
 * /api/user/verify:
 *   get:
 *     summary: Verify user email address
 *     description: Verifies a user's email using a token provided in the query parameter. Activates the user account if the token is valid.
 *     tags: [User Auth]  
 *     parameters:
 *       - in: query
 *         name: token
 *         schema:
 *           type: string
 *         required: true
 *         description: The email verification token received via email.
 *     responses:
 *       '200':
 *         description: Email verification successful. User account activated.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse' 
 *             example:
 *               success: true
 *               statusCode: 200
 *               message: "Email verification successful. You can now login."
 *               data: null
 *       '400':
 *         description: Bad Request - Missing token, invalid token, expired token, or account already verified.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse' 
 *             examples:
 *               missingToken:
 *                 value: { success: false, statusCode: 400, message: "Missing verification token." }
 *               invalidToken:
 *                 value: { success: false, statusCode: 400, message: "Invalid or expired verification link." }
 *               alreadyVerified:
 *                 value: { success: false, statusCode: 400, message: "Account already verified." }
 *       '404':
 *         description: User not found for the provided token.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               statusCode: 404
 *               message: "User associated with this token not found."
 *       '500':
 *         description: Internal server error during verification process.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               statusCode: 500
 *               message: "Server error during verification process."
 */
router.get('/verify', userAuthControllers.verifyEmail);

/**
 * @swagger
 * /api/user/register:
 *   post:
 *     summary: Register a new user
 *     description: Creates a new user account with the provided information
 *     tags: [User Auth]
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
 *                 format: password
 *     responses:
 *       '201':
 *         description: User registered successfully
 *       '400':
 *         description: Invalid input data
 *       '409':
 *         description: Email already exists
 */
router.post('/register', expressjoi(signupSchema), userAuthControllers.signup)

/**
 * @swagger
 * /api/user/login:
 *   post:
 *     summary: User login
 *     description: Authenticates a user and returns a JWT token
 *     tags: [User Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 format: password
 *     responses:
 *       '200':
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *                 user:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                     firstname:
 *                       type: string
 *                     email:
 *                       type: string
 *                     role:
 *                       type: string
 *       '401':
 *         description: Invalid credentials
 *       '403':
 *         description: Account not active or disabled
 *       '500':
 *         description: Server error
 */
router.post('/login', expressjoi(loginSchema), userAuthControllers.login)

/**
 * @swagger
 * /api/user/logout:
 *   post:
 *     summary: User logout
 *     description: Logs out a user by destroying their session
 *     tags: [User Auth]
 *     responses:
 *       '200':
 *         description: Logout successful
 *       '500':
 *         description: Server error
 */
router.post('/logout', userAuthControllers.logout)

/**
 * @swagger
 * /api/user/check-session:
 *   get:
 *     summary: Check session status
 *     description: Checks if the user has an active authenticated session
 *     tags: [User Auth]
 *     responses:
 *       '200':
 *         description: Session status returned successfully
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
 *                   example: "user is authenticated"
 *                 data:
 *                   type: object
 *                   properties:
 *                     isAuthenticated:
 *                       type: boolean
 *                       example: true
 *                     user:
 *                       type: object
 *                       properties:
 *                         _id:
 *                           type: string
 *                         firstname:
 *                           type: string
 *                         lastname:
 *                           type: string
 *                         email:
 *                           type: string
 */
router.get('/check-session', userAuthControllers.checkSession)


/**
 * @swagger
 * /api/user/request-password-reset:
 *   post:
 *     summary: Request password reset
 *     description: Sends a password reset link to the user's registered email address if the user exists.
 *     tags: [User Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: The email address of the user requesting the password reset.
 *                 example: "test.user@example.com"
 *     responses:
 *       '200':
 *         description: Password reset email sent successfully (or user not found, to prevent enumeration).
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *             example:
 *               success: true
 *               statusCode: 200
 *               message: "If an account with that email exists, a password reset link has been sent."
 *               data: null
 *       '400':
 *         description: Bad Request - Invalid email format or missing email field.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               invalidEmail:
 *                 value: { success: false, statusCode: 400, message: "\"email\" must be a valid email" }
 *               missingEmail:
 *                 value: { success: false, statusCode: 400, message: "\"email\" is required" }
 *       '500':
 *         description: Internal server error during the password reset request process.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               statusCode: 500
 *               message: "Server error requesting password reset."
 */
router.post(
    '/request-password-reset',
    expressjoi(requestResetSchema),
    userAuthControllers.requestPasswordReset
);

/**
 * @swagger
 * /api/user/reset-password/{token}:
 *   post:
 *     summary: Reset user password
 *     description: Resets the user's password using a valid token received via email.
 *     tags: [User Auth]
 *     parameters:
 *       - in: path
 *         name: token
 *         schema:
 *           type: string
 *         required: true
 *         description: The password reset token received via email.
 *         example: "a1b2c3d4e5f6..."
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - password
 *             properties:
 *               password:
 *                 type: string
 *                 format: password
 *                 description: The new password for the user account. Must meet complexity requirements.
 *                 example: "NewSecureP@ssw0rd!"
 *     responses:
 *       '200':
 *         description: Password reset successful.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *             example:
 *               success: true
 *               statusCode: 200
 *               message: "Password has been reset successfully."
 *               data: null
 *       '400':
 *         description: Bad Request - Invalid or expired token, missing password, or weak password.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               invalidToken:
 *                 value: { success: false, statusCode: 400, message: "Invalid or expired password reset token." }
 *               missingPassword:
 *                  value: { success: false, statusCode: 400, message: "\"password\" is required" }
 *               weakPassword:
 *                 value: { success: false, statusCode: 400, message: "Password does not meet strength requirements." } # Adjust based on actual validation message
 *       '500':
 *         description: Internal server error during the password reset process.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               statusCode: 500
 *               message: "Server error resetting password."
 */
router.post(
    '/reset-password/:token',
    expressjoi(performResetSchema),
    userAuthControllers.resetPassword
);
module.exports = router