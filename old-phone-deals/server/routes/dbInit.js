const express = require('express');
const router = express.Router();
const adminController = require('../controllers/dbInitController');

// Phone images initialization interface
/**
 * @swagger
 * /api/admin/init-phone-images:
 *   put:
 *     summary: Initialize phone images
 *     description: Initialize phone images
 *     responses:
 *       200:
 *         description: Phone images initialized successfully
 *       404:
 *         description: No phone data found
 *       500:
 *         description: Failed to initialize phone images
 */
router.put('/init-phone-images', adminController.initPhoneImages);

/**
 * @swagger
 * /api/admin/init-db:
 *   put:
 *     summary: Initialize database with phone and user data
 *     description: Import phone and user data from JSON files to MongoDB
 *     responses:
 *       200:
 *         description: Database initialized successfully
 *       500:
 *         description: Failed to initialize database
 */
router.put('/init-db', adminController.initPhoneData);

router.post('/init-admin', adminController.initAdminUser);

module.exports = router;