const User = require('../models/User');
const Item = require('../models/Item');
const Claim = require('../models/Claim');

// GET /api/admin/dashboard
exports.getDashboard = async (req, res, next) => {
  try {
    const [
      totalUsers,
      totalItems,
      totalClaims,
      openItems,
      resolvedItems,
      lostItems,
      foundItems,
      pendingClaims,
      approvedClaims,
      rejectedClaims,
      recentItems,
      recentClaims,
    ] = await Promise.all([
      User.countDocuments({ role: 'student' }),
      Item.countDocuments(),
      Claim.countDocuments(),
      Item.countDocuments({ status: 'Open' }),
      Item.countDocuments({ status: 'Resolved' }),
      Item.countDocuments({ reportType: 'Lost' }),
      Item.countDocuments({ reportType: 'Found' }),
      Claim.countDocuments({ status: 'Pending' }),
      Claim.countDocuments({ status: 'Approved' }),
      Claim.countDocuments({ status: 'Rejected' }),
      Item.find().sort({ createdAt: -1 }).limit(5).populate('reportedBy', 'name'),
      Claim.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .populate('item', 'itemName')
        .populate('claimedBy', 'name'),
    ]);

    return res.json({
      success: true,
      stats: {
        totalUsers,
        totalItems,
        totalClaims,
        openItems,
        resolvedItems,
        lostItems,
        foundItems,
        pendingClaims,
        approvedClaims,
        rejectedClaims,
      },
      recentItems,
      recentClaims,
    });
  } catch (err) {
    next(err);
  }
};
