const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const itemController = require('../controllers/itemController');
const { requireAuth, requireAdmin } = require('../middleware/auth');
const upload = require('../middleware/upload');

const { CATEGORIES } = require('../models/Item');

const itemRules = [
  body('itemName').trim().notEmpty().withMessage('Item name is required.').isLength({ min: 2, max: 100 }),
  body('description').trim().notEmpty().withMessage('Description is required.').isLength({ min: 10, max: 1000 }),
  body('reportType').isIn(['Lost', 'Found']).withMessage('Report type must be Lost or Found.'),
  body('category').isIn(CATEGORIES).withMessage('Invalid category.'),
  body('dateOccurred').isISO8601().withMessage('Valid date is required.'),
  body('location').trim().notEmpty().withMessage('Location is required.').isLength({ max: 150 }),
];

// Public
router.get('/', itemController.getItems);
router.get('/my', requireAuth, itemController.getMyItems);
router.get('/admin', requireAdmin, itemController.getAllItemsAdmin);
router.get('/:id', itemController.getItem);

// Protected
router.post('/', requireAuth, upload.single('image'), itemRules, itemController.createItem);
router.put('/:id', requireAuth, upload.single('image'), itemController.updateItem);
router.delete('/:id', requireAuth, itemController.deleteItem);
router.put('/:id/resolve', requireAuth, itemController.resolveItem);

module.exports = router;
