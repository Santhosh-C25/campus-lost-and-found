const mongoose = require('mongoose');

const claimSchema = new mongoose.Schema(
  {
    item: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Item',
      required: true,
    },
    claimedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    explanation: {
      type: String,
      required: [true, 'Explanation is required'],
      trim: true,
      minlength: [20, 'Explanation must be at least 20 characters'],
      maxlength: [1000, 'Explanation cannot exceed 1000 characters'],
    },
    identifyingDetails: {
      type: String,
      trim: true,
      maxlength: [500, 'Identifying details cannot exceed 500 characters'],
    },
    status: {
      type: String,
      enum: ['Pending', 'Approved', 'Rejected'],
      default: 'Pending',
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    reviewedAt: {
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

// Prevent duplicate active claims by the same user for the same item
claimSchema.index(
  { item: 1, claimedBy: 1 },
  {
    unique: true,
    partialFilterExpression: { status: 'Pending' },
  }
);

claimSchema.index({ claimedBy: 1 });
claimSchema.index({ item: 1 });
claimSchema.index({ status: 1 });

module.exports = mongoose.model('Claim', claimSchema);
