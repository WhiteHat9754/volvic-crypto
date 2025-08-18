// models/CryptoTransaction.js
const mongoose = require('mongoose');

const cryptoTransactionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['deposit', 'withdraw', 'trade'],
    required: true
  },
  currency: {
    type: String,
    enum: ['BTC', 'ETH', 'LTC', 'TRX', 'USDT'],
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'cancelled'],
    default: 'pending'
  },
  txHash: String,
  toAddress: String,
  fromAddress: String,
  fee: { type: Number, default: 0 },
  usdValue: Number,
  notes: String
}, {
  timestamps: true
});

module.exports = mongoose.model('CryptoTransaction', cryptoTransactionSchema);
