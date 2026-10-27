const { validationResult } = require('express-validator');
const Claim = require('../models/Claim');
const Item = require('../models/Item');

// POST /api/claims
exports.submitClaim = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: errors.array()[0].msg });
    }

    const { itemId, explanation, identifyingDetails } = req.body;

    const item = await Item.findById(itemId);
    if (!item) return res.status(404).json({ success: false, message: 'Item not found.' });

    if (item.status === 'Resolved') {
      return res.status(400).json({ success: false, message: 'This item is already resolved.' });
    }

    // Students cannot claim their own reports
    if (item.reportedBy.toString() === req.user.id) {
      return res.status(400).json({ success: false, message: 'You cannot claim your own report.' });
    }

    // Prevent duplicate pending claims
    const existing = await Claim.findOne({ item: itemId, claimedBy: req.user.id, status: 'Pending' });
    if (existing) {
      return res.status(409).json({ success: false, message: 'You already have a pending claim for this item.' });
    }

    const claim = await Claim.create({
      item: itemId,
      claimedBy: req.user.id,
      explanation: explanation.trim(),
      identifyingDetails: identifyingDetails?.trim(),
    });

    // Update item status
    if (item.status === 'Open') {
      item.status = 'Claim Pending';
      await item.save();
    }

    return res.status(201).json({ success: true, message: 'Claim submitted successfully.', claim });
  } catch (err) {
    // Handle unique index violation
    if (err.code === 11000) {
      return res.status(409).json({ success: false, message: 'You already have a pending claim for this item.' });
    }
    next(err);
  }
};

// GET /api/claims/my
exports.getMyClaims = async (req, res, next) => {
  try {
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(parseInt(req.query.limit) || 10, 50);
    const skip = (page - 1) * limit;

    const filter = { claimedBy: req.user.id };
    if (req.query.status) filter.status = req.query.status;

    const [claims, total] = await Promise.all([
      Claim.find(filter)
        .populate('item', 'itemName reportType category status imagePath location')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Claim.countDocuments(filter),
    ]);

    return res.json({ success: true, claims, total, page, pages: Math.ceil(total / limit) });
  } catch (err) {
    next(err);
  }
};

// GET /api/claims/:id
exports.getClaim = async (req, res, next) => {
  try {
    const claim = await Claim.findById(req.params.id)
      .populate('item', 'itemName reportType category status imagePath location reportedBy')
      .populate('claimedBy', 'name email')
      .populate('reviewedBy', 'name');

    if (!claim) return res.status(404).json({ success: false, message: 'Claim not found.' });

    // Only the claimant or an admin may view a claim
    if (claim.claimedBy._id.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorised.' });
    }

    return res.json({ success: true, claim });
  } catch (err) {
    next(err);
  }
};

// ─── Admin ────────────────────────────────────────────────────────────────────

// GET /api/admin/claims
exports.getAllClaims = async (req, res, next) => {
  try {
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(parseInt(req.query.limit) || 15, 100);
    const skip = (page - 1) * limit;

    const filter = {};
    if (req.query.status) filter.status = req.query.status;

    const [claims, total] = await Promise.all([
      Claim.find(filter)
        .populate('item', 'itemName reportType category status')
        .populate('claimedBy', 'name email')
        .populate('reviewedBy', 'name')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Claim.countDocuments(filter),
    ]);

    return res.json({ success: true, claims, total, page, pages: Math.ceil(total / limit) });
  } catch (err) {
    next(err);
  }
};

// PUT /api/admin/claims/:id/review
exports.reviewClaim = async (req, res, next) => {
  try {
    const { status, adminNotes } = req.body;
    if (!['Approved', 'Rejected'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Status must be Approved or Rejected.' });
    }

    const claim = await Claim.findById(req.params.id);
    if (!claim) return res.status(404).json({ success: false, message: 'Claim not found.' });

    if (claim.status !== 'Pending') {
      return res.status(400).json({ success: false, message: 'This claim has already been reviewed.' });
    }

    claim.status = status;
    claim.adminNotes = adminNotes?.trim();
    claim.reviewedBy = req.user.id;
    claim.reviewedAt = new Date();
    await claim.save();

    // If approved, mark the item as Resolved and reject all other pending claims for it
    if (status === 'Approved') {
      await Item.findByIdAndUpdate(claim.item, {
        status: 'Resolved',
        resolvedBy: claim.claimedBy,
        resolvedAt: new Date(),
      });

      // Reject other pending claims for the same item
      await Claim.updateMany(
        { item: claim.item, _id: { $ne: claim._id }, status: 'Pending' },
        { status: 'Rejected', adminNotes: 'Another claim was approved for this item.', reviewedAt: new Date() }
      );
    } else {
      // If all pending claims are gone, revert item to Open
      const pendingCount = await Claim.countDocuments({ item: claim.item, status: 'Pending' });
      if (pendingCount === 0) {
        await Item.findByIdAndUpdate(claim.item, { status: 'Open' });
      }
    }

    return res.json({ success: true, message: `Claim ${status.toLowerCase()}.`, claim });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/admin/claims/:id
exports.deleteClaim = async (req, res, next) => {
  try {
    const claim = await Claim.findByIdAndDelete(req.params.id);
    if (!claim) return res.status(404).json({ success: false, message: 'Claim not found.' });
    return res.json({ success: true, message: 'Claim deleted.' });
  } catch (err) {
    next(err);
  }
};
