// models/CryptoAccount.js
const mongoose = require('mongoose');

const cryptoAccountSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  balances: {
    BTC: { type: Number, default: 0 },
    ETH: { type: Number, default: 0 },
    LTC: { type: Number, default: 0 },
    TRX: { type: Number, default: 0 },
    USDT: { type: Number, default: 0 }
  },
  totalUSDValue: { type: Number, default: 0 },
  depositAddresses: {
    BTC: String,
    ETH: String
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('CryptoAccount', cryptoAccountSchema);
