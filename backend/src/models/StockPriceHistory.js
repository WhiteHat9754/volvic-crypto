// models/StockPriceHistory.js
const mongoose = require('mongoose');

const stockPriceHistorySchema = new mongoose.Schema({
  symbol: {
    type: String,
    required: true,
    uppercase: true,
    index: true
  },
  price: {
    type: Number,
    required: true
  },
  volume: {
    type: Number,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  }
}, {
  timestamps: false
});

// Compound index for efficient time-series queries
stockPriceHistorySchema.index({ symbol: 1, timestamp: -1 });

// TTL index to auto-delete old records (30 days)
stockPriceHistorySchema.index({ timestamp: 1 }, { expireAfterSeconds: 2592000 });

module.exports = mongoose.model('StockPriceHistory', stockPriceHistorySchema);
