// models/StockCache.js
const mongoose = require('mongoose');

const stockCacheSchema = new mongoose.Schema({
  symbol: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    index: true
  },
  name: {
    type: String,
    required: true,
    index: true
  },
  price: {
    type: Number,
    required: true
  },
  changeAmount: {
    type: Number,
    required: true
  },
  changePercent: {
    type: Number,
    required: true
  },
  volume: {
    type: Number,
    required: true
  },
  marketCap: {
    type: Number,
    default: null
  },
  sector: {
    type: String,
    default: null
  },
  fetchPriority: {
    type: Number,
    default: 3,
    enum: [1, 2, 3], // 1=top stocks, 2=popular, 3=others
    index: true
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },
  lastUpdated: {
    type: Date,
    default: Date.now,
    index: true
  },
  source: {
    type: String,
    default: 'yahoo_finance'
  }
}, {
  timestamps: true
});

// Compound indexes for performance
stockCacheSchema.index({ symbol: 1, isActive: 1 });
stockCacheSchema.index({ fetchPriority: 1, marketCap: -1 });
stockCacheSchema.index({ lastUpdated: -1 });

// Text search index
stockCacheSchema.index({ 
  name: 'text', 
  symbol: 'text' 
}, {
  weights: { symbol: 10, name: 5 }
});

module.exports = mongoose.model('StockCache', stockCacheSchema);
