// Backend - Watchlist model in JavaScript
const mongoose = require('mongoose');

// Backend - Add lastUpdated field to Watchlist schema if not present
const watchlistSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  stocks: [{
    symbol: String,
    name: String,
    price: Number,
    change: Number,
    changePercent: Number,
    volume: String
  }],
  lastUpdated: { type: Date, default: Date.now }, // Add this if missing
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, {
  timestamps: true
});

module.exports = mongoose.model('Watchlist', watchlistSchema);
