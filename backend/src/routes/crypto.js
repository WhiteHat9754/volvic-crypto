// routes/crypto.js - FIXED VERSION
const express = require('express');
const router = express.Router();
const CryptoAccount = require('../models/CryptoAccount');
const CryptoTransaction = require('../models/CryptoTransaction');
const CryptoTrade = require('../models/CryptoTrade');

// FIXED: Use the correct auth middleware name that matches your other working routes
const authMiddleware = require('../middleware/authMiddleware'); // Changed from 'auth' to 'authMiddleware'

// Get crypto account overview
router.get('/account', authMiddleware, async (req, res) => {
  try {
    // FIXED: Use req.user._id instead of req.user.id to match your working routes
    let account = await CryptoAccount.findOne({ userId: req.user._id });
    
    if (!account) {
      account = new CryptoAccount({
        userId: req.user._id, // Fixed: _id instead of id
        depositAddresses: {
          BTC: generateDepositAddress('BTC'),
          ETH: generateDepositAddress('ETH')
        }
      });
      await account.save();
    }

    // Get recent transactions
    const transactions = await CryptoTransaction.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .limit(10);

    // Get recent trades
    const trades = await CryptoTrade.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .limit(10);

    // FIXED: Return consistent response format like your working routes
    res.json({
      success: true,
      account,
      transactions,
      trades
    });
  } catch (error) {
    console.error('Crypto account error:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

// Deposit crypto
router.post('/deposit', authMiddleware, async (req, res) => {
  try {
    const { currency, amount } = req.body;
    
    if (!['BTC', 'ETH'].includes(currency)) {
      return res.status(400).json({ 
        success: false,
        error: 'Only BTC and ETH deposits allowed' 
      });
    }

    const account = await CryptoAccount.findOne({ userId: req.user._id });
    if (!account) {
      return res.status(404).json({
        success: false,
        error: 'Crypto account not found'
      });
    }
    
    const transaction = new CryptoTransaction({
      userId: req.user._id, // Fixed: _id instead of id
      type: 'deposit',
      currency,
      amount,
      status: 'pending',
      toAddress: account.depositAddresses[currency]
    });

    await transaction.save();
    
    res.json({ 
      success: true,
      transaction, 
      depositAddress: account.depositAddresses[currency] 
    });
  } catch (error) {
    console.error('Deposit error:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

// Withdraw crypto
router.post('/withdraw', authMiddleware, async (req, res) => {
  try {
    const { currency, amount, toAddress } = req.body;
    
    if (!['BTC', 'ETH', 'LTC', 'TRX'].includes(currency)) {
      return res.status(400).json({ 
        success: false,
        error: 'Unsupported currency' 
      });
    }

    const account = await CryptoAccount.findOne({ userId: req.user._id });
    if (!account) {
      return res.status(404).json({
        success: false,
        error: 'Crypto account not found'
      });
    }
    
    if (account.balances[currency] < amount) {
      return res.status(400).json({ 
        success: false,
        error: 'Insufficient balance' 
      });
    }

    // Create pending withdrawal
    const transaction = new CryptoTransaction({
      userId: req.user._id, // Fixed: _id instead of id
      type: 'withdraw',
      currency,
      amount,
      status: 'pending',
      toAddress,
      fee: calculateWithdrawFee(currency, amount)
    });

    // Update balance (pending withdrawal)
    account.balances[currency] -= amount;
    await account.save();
    await transaction.save();

    res.json({ 
      success: true,
      transaction 
    });
  } catch (error) {
    console.error('Withdraw error:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

// Place trade order
router.post('/trade', authMiddleware, async (req, res) => {
  try {
    const { pair, type, amount, price, orderType = 'market' } = req.body;
    
    const account = await CryptoAccount.findOne({ userId: req.user._id });
    if (!account) {
      return res.status(404).json({
        success: false,
        error: 'Crypto account not found'
      });
    }
    
    const [baseCurrency, quoteCurrency] = pair.split('/');
    
    // Validate balance
    if (type === 'buy') {
      const total = amount * price;
      if (account.balances[quoteCurrency] < total) {
        return res.status(400).json({ 
          success: false,
          error: 'Insufficient balance' 
        });
      }
    } else {
      if (account.balances[baseCurrency] < amount) {
        return res.status(400).json({ 
          success: false,
          error: 'Insufficient balance' 
        });
      }
    }

    const trade = new CryptoTrade({
      userId: req.user._id, // Fixed: _id instead of id
      pair,
      type,
      orderType,
      amount,
      price,
      total: amount * price,
      fee: calculateTradeFee(amount * price)
    });

    await trade.save();
    
    res.json({ 
      success: true,
      trade 
    });
  } catch (error) {
    console.error('Trade error:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

function generateDepositAddress(currency) {
  const currencyLower = currency.toLowerCase();
  
  // Get static addresses from environment variables
  const staticAddresses = {
    btc: process.env.BTC_DEPOSIT_ADDRESS || '',
    eth: process.env.ETH_DEPOSIT_ADDRESS || '',
    usdt: process.env.USDT_DEPOSIT_ADDRESS || '',
    ltc: process.env.LTC_DEPOSIT_ADDRESS || '',
    bnb: process.env.BNB_DEPOSIT_ADDRESS || ''
  };
  
  // Return static address if exists, otherwise generate dynamic
  return staticAddresses[currencyLower] || 
         `${currencyLower}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}



function calculateWithdrawFee(currency, amount) {
  const fees = { BTC: 0.0005, ETH: 0.005, LTC: 0.001, TRX: 1 };
  return fees[currency] || 0;
}

function calculateTradeFee(total) {
  return total * 0.001; 
}

module.exports = router;
