const { validationResult } = require('express-validator');
const path = require('path');
const fs = require('fs');
const Item = require('../models/Item');
const Claim = require('../models/Claim');

// ─── Helpers ─────────────────────────────────────────────────────────────────

const deleteImageFile = (imagePath) => {
  if (!imagePath) return;
  const abs = path.join(__dirname, '../../uploads/images', path.basename(imagePath));
  if (fs.existsSync(abs)) fs.unlinkSync(abs);
};

const buildQuery = (query) => {
  const filter = {};
  if (query.search) {
    filter.$text = { $search: query.search };
  }
  if (query.reportType && ['Lost', 'Found'].includes(query.reportType)) {
    filter.reportType = query.reportType;
  }
  if (query.category) {
    filter.category = query.category;
  }
  if (query.status) {
    filter.status = query.status;
  }
  if (query.location) {
    filter.location = new RegExp(query.location.trim(), 'i');
  }
  if (query.dateFrom || query.dateTo) {
    filter.dateOccurred = {};
    if (query.dateFrom) filter.dateOccurred.$gte = new Date(query.dateFrom);
    if (query.dateTo) filter.dateOccurred.$lte = new Date(query.dateTo);
  }
  return filter;
};

// ─── Public / Student routes ──────────────────────────────────────────────────

// GET /api/items
exports.getItems = async (req, res, next) => {
  try {
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(parseInt(req.query.limit) || 12, 50);
    const skip = (page - 1) * limit;

    const sort = req.query.sort === 'oldest' ? { createdAt: 1 } : { createdAt: -1 };

    const filter = buildQuery(req.query);

    const [items, total] = await Promise.all([
      Item.find(filter)
        .populate('reportedBy', 'name email')
        .sort(sort)
        .skip(skip)
        .limit(limit),
      Item.countDocuments(filter),
    ]);

    return res.json({ success: true, items, total, page, pages: Math.ceil(total / limit) });
  } catch (err) {
    next(err);
  }
};

// GET /api/items/:id
exports.getItem = async (req, res, next) => {
  try {
    const item = await Item.findById(req.params.id).populate('reportedBy', 'name email department');
    if (!item) return res.status(404).json({ success: false, message: 'Item not found.' });
    return res.json({ success: true, item });
  } catch (err) {
    next(err);
  }
};

// POST /api/items
exports.createItem = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      // Remove uploaded file if validation fails
      if (req.file) deleteImageFile(req.file.filename);
      return res.status(400).json({ success: false, message: errors.array()[0].msg });
    }

    const { itemName, description, reportType, category, dateOccurred, location } = req.body;

    const item = await Item.create({
      itemName: itemName.trim(),
      description: description.trim(),
      reportType,
      category,
      dateOccurred: new Date(dateOccurred),
      location: location.trim(),
      imagePath: req.file ? `/uploads/images/${req.file.filename}` : null,
      reportedBy: req.user.id,
    });

    return res.status(201).json({ success: true, message: 'Report created successfully.', item });
  } catch (err) {
    if (req.file) deleteImageFile(req.file.filename);
    next(err);
  }
};

// PUT /api/items/:id
exports.updateItem = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      if (req.file) deleteImageFile(req.file.filename);
      return res.status(400).json({ success: false, message: errors.array()[0].msg });
    }

    const item = await Item.findById(req.params.id);
    if (!item) return res.status(404).json({ success: false, message: 'Item not found.' });

    // Only owner or admin can update
    if (item.reportedBy.toString() !== req.user.id && req.user.role !== 'admin') {
      if (req.file) deleteImageFile(req.file.filename);
      return res.status(403).json({ success: false, message: 'Not authorised.' });
    }

    // Cannot edit resolved items (students only)
    if (item.status === 'Resolved' && req.user.role !== 'admin') {
      if (req.file) deleteImageFile(req.file.filename);
      return res.status(400).json({ success: false, message: 'Resolved items cannot be edited.' });
    }

    const { itemName, description, reportType, category, dateOccurred, location, adminNotes } = req.body;

    if (itemName) item.itemName = itemName.trim();
    if (description) item.description = description.trim();
    if (reportType) item.reportType = reportType;
    if (category) item.category = category;
    if (dateOccurred) item.dateOccurred = new Date(dateOccurred);
    if (location) item.location = location.trim();
    if (adminNotes !== undefined && req.user.role === 'admin') item.adminNotes = adminNotes.trim();

    if (req.file) {
      // Remove old image
      deleteImageFile(item.imagePath);
      item.imagePath = `/uploads/images/${req.file.filename}`;
    }

    await item.save();
    return res.json({ success: true, message: 'Report updated.', item });
  } catch (err) {
    if (req.file) deleteImageFile(req.file.filename);
    next(err);
  }
};

// DELETE /api/items/:id
exports.deleteItem = async (req, res, next) => {
  try {
    const item = await Item.findById(req.params.id);
    if (!item) return res.status(404).json({ success: false, message: 'Item not found.' });

    if (item.reportedBy.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorised.' });
    }

    // Remove associated claims
    await Claim.deleteMany({ item: item._id });
    deleteImageFile(item.imagePath);
    await Item.findByIdAndDelete(req.params.id);

    return res.json({ success: true, message: 'Report deleted.' });
  } catch (err) {
    next(err);
  }
};

// GET /api/items/my
exports.getMyItems = async (req, res, next) => {
  try {
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(parseInt(req.query.limit) || 12, 50);
    const skip = (page - 1) * limit;

    const filter = { reportedBy: req.user.id };
    if (req.query.status) filter.status = req.query.status;

    const [items, total] = await Promise.all([
      Item.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Item.countDocuments(filter),
    ]);

    return res.json({ success: true, items, total, page, pages: Math.ceil(total / limit) });
  } catch (err) {
    next(err);
  }
};

// PUT /api/items/:id/resolve
exports.resolveItem = async (req, res, next) => {
  try {
    const item = await Item.findById(req.params.id);
    if (!item) return res.status(404).json({ success: false, message: 'Item not found.' });

    if (item.reportedBy.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorised.' });
    }

    item.status = 'Resolved';
    item.resolvedBy = req.user.id;
    item.resolvedAt = new Date();
    await item.save();

    return res.json({ success: true, message: 'Item marked as resolved.', item });
  } catch (err) {
    next(err);
  }
};

// ─── Admin ────────────────────────────────────────────────────────────────────

// GET /api/admin/items
exports.getAllItemsAdmin = async (req, res, next) => {
  try {
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(parseInt(req.query.limit) || 15, 100);
    const skip = (page - 1) * limit;

    const filter = buildQuery(req.query);
    const sort = req.query.sort === 'oldest' ? { createdAt: 1 } : { createdAt: -1 };

    const [items, total] = await Promise.all([
      Item.find(filter).populate('reportedBy', 'name email').sort(sort).skip(skip).limit(limit),
      Item.countDocuments(filter),
    ]);

    return res.json({ success: true, items, total, page, pages: Math.ceil(total / limit) });
  } catch (err) {
    next(err);
  }
};
