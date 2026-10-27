const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const userController = require('../controllers/userController');
const { requireAuth, requireAdmin } = require('../middleware/auth');

const profileRules = [
  body('name').trim().notEmpty().withMessage('Name is required.').isLength({ min: 2, max: 60 }),
];

const passwordRules = [
  body('currentPassword').notEmpty().withMessage('Current password is required.'),
  body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters.'),
];

router.get('/profile', requireAuth, userController.getProfile);
router.put('/profile', requireAuth, profileRules, userController.updateProfile);
router.put('/change-password', requireAuth, passwordRules, userController.changePassword);

// Admin user management
router.get('/admin/users', requireAdmin, userController.getAllUsers);
router.put('/admin/users/:id/toggle-status', requireAdmin, userController.toggleUserStatus);
router.delete('/admin/users/:id', requireAdmin, userController.deleteUser);

module.exports = router;
