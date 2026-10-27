const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const claimController = require('../controllers/claimController');
const { requireAuth, requireAdmin } = require('../middleware/auth');

const claimRules = [
  body('itemId').isMongoId().withMessage('Valid item ID is required.'),
  body('explanation')
    .trim()
    .notEmpty()
    .withMessage('Explanation is required.')
    .isLength({ min: 20, max: 1000 }),
];

// Student routes
router.post('/', requireAuth, claimRules, claimController.submitClaim);
router.get('/my', requireAuth, claimController.getMyClaims);
router.get('/:id', requireAuth, claimController.getClaim);

// Admin routes
router.get('/admin/all', requireAdmin, claimController.getAllClaims);
router.put('/admin/:id/review', requireAdmin, claimController.reviewClaim);
router.delete('/admin/:id', requireAdmin, claimController.deleteClaim);

module.exports = router;
