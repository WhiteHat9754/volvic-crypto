// models/CryptoTrade.js
const mongoose = require('mongoose');

const cryptoTradeSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  pair: {
    type: String,
    required: true // e.g., 'BTC/USDT'
  },
  type: {
    type: String,
    enum: ['buy', 'sell'],
    required: true
  },
  orderType: {
    type: String,
    enum: ['market', 'limit'],
    default: 'market'
  },
  amount: {
    type: Number,
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  total: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'cancelled', 'partial'],
    default: 'pending'
  },
  executedAmount: { type: Number, default: 0 },
  fee: { type: Number, default: 0 },
  pnl: { type: Number, default: 0 }
}, {
  timestamps: true
});

module.exports = mongoose.model('CryptoTrade', cryptoTradeSchema);
