// routes/portfolio.js (Final Complete Version)

const express = require('express');
const router = express.Router();
const Portfolio = require('../models/Portfolio');
const Transaction = require('../models/Transaction');
const Trade = require('../models/Trade');
const authMiddleware = require('../middleware/authMiddleware');
const stockService = require('../services/stockService');

// --[ GET Portfolio Overview ]--
router.get('/', authMiddleware, async (req, res) => {
  try {
    let portfolio = await Portfolio.findOne({ userId: req.user._id });
    if (!portfolio) {
      portfolio = new Portfolio({
        userId: req.user._id,
        cashBalance: 10000,
        totalValue: 10000,
        totalPnL: 0,
        stocks: [],
        adminPnLAdjustment: 0
      });
      await portfolio.save();
    }
    // Update prices
    await updateStockPrices(portfolio);

    // Key metrics
    const stockValue = portfolio.stocks.reduce((sum, stock) => sum + (stock.quantity * stock.currentPrice), 0);
    const totalInvested = portfolio.stocks.reduce((sum, stock) => sum + (stock.quantity * stock.purchasePrice), 0);
    const unrealizedPnL = stockValue - totalInvested;
    const totalPnL = unrealizedPnL + (portfolio.adminPnLAdjustment || 0);

    // Response
    res.json({
      success: true,
      portfolio: {
        ...portfolio.toObject(),
        stockValue,
        totalInvested,
        availableBalance: portfolio.cashBalance,
        unrealizedPnL,
        realizedPnL: portfolio.adminPnLAdjustment,
        totalPnL,
        positions: portfolio.stocks.map(stock => ({
          symbol: stock.symbol,
          quantity: stock.quantity,
          purchasePrice: stock.purchasePrice,
          currentPrice: stock.currentPrice,
          unrealizedPnL: (stock.currentPrice - stock.purchasePrice) * stock.quantity,
          unrealizedPnLPercent: ((stock.currentPrice - stock.purchasePrice) / stock.purchasePrice) * 100,
          marketValue: stock.quantity * stock.currentPrice,
          lastUpdated: stock.lastUpdated
        }))
      }
    });
  } catch (error) {
    console.error('Portfolio fetch error:', error);
    res.status(500).json({ success: false, error: 'Error fetching portfolio' });
  }
});

// --[ GET Analytics ]--
router.get('/analytics', authMiddleware, async (req, res) => {
  try {
    const portfolio = await Portfolio.findOne({ userId: req.user._id });
    if (!portfolio) return res.status(404).json({ success: false, error: 'Portfolio not found' });

    const transactions = await Transaction.find({ userId: req.user._id }).sort({ timestamp: -1 });
    const totalTrades = transactions.length;
    const buyTrades = transactions.filter(t => t.type === 'buy').length;
    const sellTrades = transactions.filter(t => t.type === 'sell').length;

    const stockValue = portfolio.stocks.reduce((sum, stock) => sum + (stock.quantity * stock.currentPrice), 0);
    const totalInvested = portfolio.stocks.reduce((sum, stock) => sum + (stock.quantity * stock.purchasePrice), 0);

    // Distribution
    const distribution = portfolio.stocks.map(stock => {
      const value = stock.quantity * stock.currentPrice;
      return {
        symbol: stock.symbol,
        value,
        percentage: stockValue > 0 ? (value / stockValue) * 100 : 0,
        quantity: stock.quantity,
        pnl: (stock.currentPrice - stock.purchasePrice) * stock.quantity,
        pnlPercent: stock.purchasePrice > 0 ?
          ((stock.currentPrice - stock.purchasePrice) / stock.purchasePrice) * 100 : 0
      };
    }).sort((a, b) => b.value - a.value);

    res.json({
      success: true,
      analytics: {
        totalTrades,
        buyTrades,
        sellTrades,
        totalInvested,
        currentValue: stockValue,
        cashBalance: portfolio.cashBalance,
        totalPortfolioValue: portfolio.totalValue,
        unrealizedPnL: stockValue - totalInvested,
        totalPnL: portfolio.totalPnL,
        adminAdjustments: portfolio.adminPnLAdjustment,
        stockDistribution: distribution
      }
    });
  } catch (error) {
    console.error('Portfolio analytics error:', error);
    res.status(500).json({ success: false, error: 'Error fetching portfolio analytics' });
  }
});

// --[ GET Transaction History ]--
router.get('/transactions', authMiddleware, async (req, res) => {
  try {
    const { limit = 20, page = 1 } = req.query;
    const transactions = await Transaction.find({ userId: req.user._id })
      .sort({ timestamp: -1 })
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit))
      .lean();
    res.json({ success: true, transactions });
  } catch (error) {
    console.error('Portfolio transactions error:', error);
    res.status(500).json({ success: false, error: 'Error fetching transactions' });
  }
});

// --[ GET Portfolio Positions ]--
router.get('/positions', authMiddleware, async (req, res) => {
  try {
    const portfolio = await Portfolio.findOne({ userId: req.user._id });
    if (!portfolio || !portfolio.stocks.length) {
      return res.json({ success: true, positions: [] });
    }
    await updateStockPrices(portfolio);
    const positions = portfolio.stocks.map(stock => ({
      symbol: stock.symbol,
      quantity: stock.quantity,
      purchasePrice: stock.purchasePrice,
      currentPrice: stock.currentPrice,
      marketValue: stock.quantity * stock.currentPrice,
      unrealizedPnL: (stock.currentPrice - stock.purchasePrice) * stock.quantity,
      unrealizedPnLPercent: stock.purchasePrice === 0 ? 0 :
        ((stock.currentPrice - stock.purchasePrice) / stock.purchasePrice) * 100,
      lastUpdated: stock.lastUpdated
    }));
    res.json({ success: true, positions });
  } catch (error) {
    console.error('Positions error:', error);
    res.status(500).json({ success: false, error: 'Error fetching positions' });
  }
});

// --[ POST Refresh (update prices) ]--
router.post('/refresh', authMiddleware, async (req, res) => {
  try {
    const portfolio = await Portfolio.findOne({ userId: req.user._id });
    if (!portfolio) {
      return res.status(404).json({ success: false, error: 'Portfolio not found' });
    }
    await updateStockPrices(portfolio);
    await portfolio.save();
    res.json({ success: true, message: 'Prices refreshed', portfolio });
  } catch (error) {
    console.error('Portfolio refresh error:', error);
    res.status(500).json({ success: false, error: 'Error refreshing portfolio' });
  }
});

// --[ Internal Helper: updateStockPrices ]--
async function updateStockPrices(portfolio) {
  try {
    if (portfolio.stocks.length === 0) return portfolio;
    const quotes = await stockService.getMultipleQuotes(
      portfolio.stocks.map(stock => stock.symbol)
    );
    portfolio.stocks.forEach(stock => {
      const quote = quotes[stock.symbol];
      if (quote && quote.c) {
        stock.currentPrice = quote.c;
        stock.lastUpdated = new Date();
      }
    });
  } catch (error) {
    console.warn('Stock price update warning:', error.message);
  }
  return portfolio;
}

// --[ Health Check ]--
router.get('/health', (req, res) => {
  res.json({
    success: true,
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    endpoints: [
      'GET /           - Portfolio Overview',
      'GET /analytics  - Performance Analytics',
      'GET /positions  - Current Positions',
      'GET /transactions - Transaction History',
      'POST /refresh   - Manually refresh prices',
      'GET /health     - Health check'
    ]
  });
});

module.exports = router;
