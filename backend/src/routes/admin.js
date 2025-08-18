// routes/admin.js - Updated with crypto withdrawals and better formatting
const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Portfolio = require('../models/Portfolio');
const Transaction = require('../models/Transaction');
const CryptoTransaction = require('../models/CryptoTransaction');
const authMiddleware = require('../middleware/authMiddleware');

// Admin middleware
const adminMiddleware = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }
  next();
};

// Get all users
router.get('/users', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const users = await User.find({}, '-password').sort({ createdAt: -1 });
    res.json({ users }); // Wrapped in object for consistency
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Error fetching users' });
  }
});

// Get all portfolios
router.get('/portfolios', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const portfolios = await Portfolio.find({}).sort({ totalValue: -1 });
    res.json({ portfolios }); // Wrapped in object for consistency
  } catch (error) {
    console.error('Error fetching portfolios:', error);
    res.status(500).json({ message: 'Error fetching portfolios' });
  }
});

// Get crypto withdrawal requests
router.get('/withdrawals', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const withdrawals = await CryptoTransaction.find({ type: 'withdraw' })
      .sort({ createdAt: -1 });

    // Populate user data for each withdrawal
    const withdrawalsWithUsers = await Promise.all(
      withdrawals.map(async (withdrawal) => {
        const user = await User.findById(withdrawal.userId, 'email firstName lastName');
        return {
          ...withdrawal.toObject(),
          user: user || { email: 'Unknown User' }
        };
      })
    );

    res.json({ withdrawals: withdrawalsWithUsers });
  } catch (error) {
    console.error('Error fetching withdrawals:', error);
    res.status(500).json({ message: 'Error fetching withdrawals' });
  }
});

// Handle withdrawal approval/rejection
router.patch('/withdrawals/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { action, adminNotes } = req.body;
    const withdrawalId = req.params.id;

    const withdrawal = await CryptoTransaction.findById(withdrawalId);
    if (!withdrawal) {
      return res.status(404).json({ error: 'Withdrawal not found' });
    }

    if (withdrawal.status !== 'pending') {
      return res.status(400).json({ error: 'Withdrawal already processed' });
    }

    // Update withdrawal status
    withdrawal.status = action === 'approve' ? 'approved' : 'rejected';
    withdrawal.adminNotes = adminNotes || '';
    withdrawal.processedAt = new Date();

    // If rejecting, return funds to user's portfolio
    if (action === 'reject') {
      const portfolio = await Portfolio.findOne({ userId: withdrawal.userId });
      if (portfolio) {
        // Return the withdrawal amount to cash balance
        portfolio.cashBalance += withdrawal.amount;
        portfolio.totalValue += withdrawal.amount;
        await portfolio.save();
      }
    }

    await withdrawal.save();

    res.json({ 
      success: true,
      message: `Withdrawal ${action}d successfully` 
    });
  } catch (error) {
    console.error(`Error ${req.body.action}ing withdrawal:`, error);
    res.status(500).json({ error: 'Error processing withdrawal' });
  }
});

// Toggle user active status
router.patch('/users/:userId/status', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { userId } = req.params;
    const { isActive } = req.body;

    const user = await User.findByIdAndUpdate(
      userId,
      { isActive },
      { new: true, select: '-password' }
    );

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ 
      success: true,
      message: `User ${isActive ? 'activated' : 'deactivated'} successfully`,
      user 
    });
  } catch (error) {
    console.error('Error updating user status:', error);
    res.status(500).json({ message: 'Error updating user status' });
  }
});

// Get system statistics
router.get('/stats', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const portfolios = await Portfolio.find({});
    const totalPortfolioValue = portfolios.reduce((sum, p) => sum + p.totalValue, 0);
    const totalTrades = await Transaction.countDocuments();
    
    // Active users (users who traded in last 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const activeUsers = await User.countDocuments({ 
      lastLogin: { $gte: thirtyDaysAgo },
      isActive: true 
    });

    // Crypto withdrawal stats
    const pendingWithdrawals = await CryptoTransaction.countDocuments({ 
      type: 'withdraw', 
      status: 'pending' 
    });

    const pendingWithdrawalAmounts = await CryptoTransaction.find({
      type: 'withdraw',
      status: 'pending'
    });

    const totalWithdrawalAmount = pendingWithdrawalAmounts.reduce((sum, w) => {
      // Convert crypto amounts to approximate USD (simplified)
      const cryptoToUsd = {
        'BTC': 45000,
        'ETH': 3200,
        'LTC': 150,
        'TRX': 0.08,
        'USDT': 1
      };
      return sum + (w.amount * (cryptoToUsd[w.currency] || 1));
    }, 0);

    const stats = {
      totalUsers,
      totalPortfolioValue,
      totalTrades,
      activeUsers,
      pendingWithdrawals,
      totalWithdrawalAmount
    };

    res.json({ stats });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ message: 'Error fetching system statistics' });
  }
});

// Adjust user P&L
router.post('/adjust-pnl', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { userId, adjustment, reason } = req.body;

    if (!userId || adjustment === undefined || !reason) {
      return res.status(400).json({ message: 'User ID, adjustment amount, and reason are required' });
    }

    const portfolio = await Portfolio.findOne({ userId });
    if (!portfolio) {
      return res.status(404).json({ message: 'Portfolio not found' });
    }

    // Apply adjustment
    portfolio.adminPnLAdjustment += adjustment;
    portfolio.totalPnL += adjustment;
    portfolio.totalValue += adjustment;

    // Log the adjustment
    if (!portfolio.adminActions) {
      portfolio.adminActions = [];
    }
    
    portfolio.adminActions.push({
      type: 'pnl_adjustment',
      amount: adjustment,
      reason: reason,
      adminId: req.user._id,
      timestamp: new Date()
    });

    await portfolio.save();

    // Create transaction record for audit
    const transaction = new Transaction({
      userId: userId,
      type: 'admin_adjustment',
      symbol: 'ADMIN',
      quantity: 1,
      price: adjustment,
      totalValue: adjustment,
      timestamp: new Date(),
      metadata: {
        reason: reason,
        adminId: req.user._id,
        adminEmail: req.user.email
      }
    });

    await transaction.save();

    res.json({ 
      success: true,
      message: 'P&L adjusted successfully',
      newTotalValue: portfolio.totalValue,
      newTotalPnL: portfolio.totalPnL,
      totalAdjustments: portfolio.adminPnLAdjustment
    });

  } catch (error) {
    console.error('Error adjusting P&L:', error);
    res.status(500).json({ message: 'Error adjusting P&L' });
  }
});

// Get user details with portfolio
router.get('/user/:userId', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { userId } = req.params;
    
    const user = await User.findById(userId, '-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const portfolio = await Portfolio.findOne({ userId });
    const transactions = await Transaction.find({ userId }).sort({ timestamp: -1 }).limit(20);
    const cryptoTransactions = await CryptoTransaction.find({ userId }).sort({ createdAt: -1 }).limit(10);

    res.json({
      success: true,
      user,
      portfolio,
      transactions,
      cryptoTransactions
    });
  } catch (error) {
    console.error('Error fetching user details:', error);
    res.status(500).json({ message: 'Error fetching user details' });
  }
});

// Delete user account
router.delete('/user/:userId', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { userId } = req.params;

    // Delete user's related data first
    await Portfolio.deleteOne({ userId });
    await Transaction.deleteMany({ userId });
    await CryptoTransaction.deleteMany({ userId });
    
    // Delete the user
    const deletedUser = await User.findByIdAndDelete(userId);
    
    if (!deletedUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ 
      success: true,
      message: 'User account deleted successfully' 
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ message: 'Error deleting user account' });
  }
});

// Get all transactions (admin view)
router.get('/transactions', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { page = 1, limit = 50, userId, symbol, type } = req.query;
    
    let query = {};
    if (userId) query.userId = userId;
    if (symbol) query.symbol = new RegExp(symbol, 'i');
    if (type) query.type = type;

    const transactions = await Transaction.find(query)
      .sort({ timestamp: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    // Get user emails for transactions
    const transactionsWithUsers = await Promise.all(
      transactions.map(async (tx) => {
        const user = await User.findById(tx.userId, 'email');
        return {
          ...tx.toObject(),
          userEmail: user?.email || 'Unknown'
        };
      })
    );

    const total = await Transaction.countDocuments(query);

    res.json({
      success: true,
      transactions: transactionsWithUsers,
      pagination: {
        totalPages: Math.ceil(total / limit),
        currentPage: parseInt(page),
        total,
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({ message: 'Error fetching transactions' });
  }
});

// Update user role
router.put('/user/:userId/role', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;

    if (!['user', 'admin'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }

    const user = await User.findByIdAndUpdate(
      userId, 
      { role },
      { new: true, select: '-password' }
    );

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ 
      success: true,
      message: 'User role updated successfully', 
      user 
    });
  } catch (error) {
    console.error('Error updating user role:', error);
    res.status(500).json({ message: 'Error updating user role' });
  }
});

// Bulk user actions
router.post('/users/bulk-action', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { action, userIds } = req.body;

    if (!action || !Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({ message: 'Action and user IDs are required' });
    }

    let result;
    switch (action) {
      case 'activate':
        result = await User.updateMany(
          { _id: { $in: userIds } },
          { isActive: true }
        );
        break;
      case 'deactivate':
        result = await User.updateMany(
          { _id: { $in: userIds } },
          { isActive: false }
        );
        break;
      case 'delete':
        // Delete related data first
        await Portfolio.deleteMany({ userId: { $in: userIds } });
        await Transaction.deleteMany({ userId: { $in: userIds } });
        await CryptoTransaction.deleteMany({ userId: { $in: userIds } });
        result = await User.deleteMany({ _id: { $in: userIds } });
        break;
      default:
        return res.status(400).json({ message: 'Invalid action' });
    }

    res.json({
      success: true,
      message: `Bulk ${action} completed successfully`,
      affected: result.modifiedCount || result.deletedCount
    });
  } catch (error) {
    console.error('Error performing bulk action:', error);
    res.status(500).json({ message: 'Error performing bulk action' });
  }
});

// Export user data
router.get('/export/users', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const users = await User.find({}, '-password').lean();
    const portfolios = await Portfolio.find({}).lean();
    
    const exportData = users.map(user => {
      const portfolio = portfolios.find(p => p.userId.toString() === user._id.toString());
      return {
        email: user.email,
        role: user.role,
        accountType: user.accountType,
        isActive: user.isActive,
        createdAt: user.createdAt,
        lastLogin: user.lastLogin,
        totalValue: portfolio?.totalValue || 0,
        cashBalance: portfolio?.cashBalance || 0,
        totalPnL: portfolio?.totalPnL || 0,
        stocksCount: portfolio?.stocks?.length || 0
      };
    });

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename=users-export-${new Date().toISOString().split('T')[0]}.json`);
    res.json(exportData);
  } catch (error) {
    console.error('Error exporting users:', error);
    res.status(500).json({ message: 'Error exporting user data' });
  }
});

module.exports = router;
