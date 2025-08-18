const mongoose = require('mongoose');

const portfolioSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  cashBalance: {
    type: Number,
    default: 10000 // Starting demo balance
  },
  totalValue: {
    type: Number,
    default: 10000
  },
  totalPnL: {
    type: Number,
    default: 0
  },
  adminPnLAdjustment: {
    type: Number,
    default: 0
  },
  stocks: [{
    symbol: {
      type: String,
      required: true
    },
    quantity: {
      type: Number,
      required: true,
      min: 0
    },
    purchasePrice: {
      type: Number,
      required: true,
      min: 0
    },
    currentPrice: {
      type: Number,
      default: 0
    },
    lastUpdated: {
      type: Date,
      default: Date.now
    }
  }],
  adminActions: [{
    type: {
      type: String,
      enum: ['pnl_adjustment', 'balance_adjustment', 'stock_adjustment']
    },
    amount: Number,
    reason: String,
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// The pre-save middleware should be outside the schema definition
portfolioSchema.pre('save', function(next) {
  const stockValue = this.stocks.reduce((total, stock) => {
    return total + (stock.quantity * stock.currentPrice);
  }, 0);
  
  this.totalValue = this.cashBalance + stockValue + this.adminPnLAdjustment;
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('Portfolio', portfolioSchema);
