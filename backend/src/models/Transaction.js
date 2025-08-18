const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['buy', 'sell', 'admin_adjustment'],
    required: true
  },
  symbol: {
    type: String,
    required: true,
    uppercase: true
  },
  quantity: {
    type: Number,
    required: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  totalValue: {
    type: Number
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  metadata: {
    reason: String,
    adminId: mongoose.Schema.Types.ObjectId,
    adminEmail: String,
    originalPrice: Number,
    fees: Number
  }
}, {
  timestamps: true
});

// Calculate total value before saving
transactionSchema.pre('save', function(next) {
  if (this.type !== 'admin_adjustment') {
    this.totalValue = this.quantity * this.price;
  } else {
    this.totalValue = this.price; // For admin adjustments, price field contains the adjustment amount
  }
  next();
});

module.exports = mongoose.model('Transaction', transactionSchema);
