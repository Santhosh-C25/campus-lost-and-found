const mongoose = require('mongoose');

const CATEGORIES = [
  'Electronics',
  'Documents',
  'Bags',
  'Keys',
  'Accessories',
  'Clothing',
  'Books',
  'Other',
];

const itemSchema = new mongoose.Schema(
  {
    itemName: {
      type: String,
      required: [true, 'Item name is required'],
      trim: true,
      minlength: [2, 'Item name must be at least 2 characters'],
      maxlength: [100, 'Item name cannot exceed 100 characters'],
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
      minlength: [10, 'Description must be at least 10 characters'],
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
    },
    reportType: {
      type: String,
      enum: ['Lost', 'Found'],
      required: [true, 'Report type is required'],
    },
    category: {
      type: String,
      enum: CATEGORIES,
      required: [true, 'Category is required'],
    },
    dateOccurred: {
      type: Date,
      required: [true, 'Date is required'],
    },
    location: {
      type: String,
      required: [true, 'Location is required'],
      trim: true,
      maxlength: [150, 'Location cannot exceed 150 characters'],
    },
    imagePath: {
      type: String,
      default: null,
    },
    status: {
      type: String,
      enum: ['Open', 'Claim Pending', 'Resolved'],
      default: 'Open',
    },
    reportedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    resolvedAt: {
      type: Date,
      default: null,
    },
    adminNotes: {
      type: String,
      trim: true,
      maxlength: [500, 'Admin notes cannot exceed 500 characters'],
    },
  },
  { timestamps: true }
);

// Full-text search index
itemSchema.index({ itemName: 'text', description: 'text', location: 'text' });
itemSchema.index({ reportType: 1, category: 1, status: 1 });
itemSchema.index({ reportedBy: 1 });
itemSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Item', itemSchema);
module.exports.CATEGORIES = CATEGORIES;
