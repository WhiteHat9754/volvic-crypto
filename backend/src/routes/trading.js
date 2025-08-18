// routes/trading.js - Final Complete Version with ALL fixes applied
const express = require('express');
const Portfolio = require('../models/Portfolio');
const Transaction = require('../models/Transaction');
const Trade = require('../models/Trade');
const authMiddleware = require('../middleware/authMiddleware');
const mongoose = require('mongoose');

const router = express.Router();

// Mock stock service with realistic prices
const mockStockService = {
  getCurrentPrice: async (symbol) => {
    const mockPrices = {
      'AAPL': 185.25, 'GOOGL': 142.86, 'MSFT': 378.91, 'TSLA': 248.42,
      'NVDA': 895.23, 'AMZN': 145.67, 'META': 312.89, 'BTC-USD': 45678.90,
      'ETH-USD': 3842.15, 'SOL-USD': 142.67, 'ADA-USD': 0.6234,
      'JPM': 145.32, 'JNJ': 167.45, 'NFLX': 425.30, 'DIS': 95.40,
      'PYPL': 78.65, 'ADBE': 542.10, 'CRM': 267.85, 'V': 245.67
    };
    
    const basePrice = mockPrices[symbol] || 100;
    const variation = (Math.random() - 0.5) * 0.02; // ±1% variation
    return parseFloat((basePrice * (1 + variation)).toFixed(2));
  }
};

// Try to import real stock service, fallback to mock
let stockService;
try {
  stockService = require('../services/stockService');
} catch (error) {
  console.warn('Stock service not found, using mock service');
  stockService = mockStockService;
}

// FIXED: Helper function to update stock prices
async function updateStockPrices(portfolio) {
  try {
    for (const stock of portfolio.stocks) {
      try {
        const currentPrice = await stockService.getCurrentPrice(stock.symbol);
        stock.currentPrice = currentPrice;
        stock.lastUpdated = new Date();
      } catch (error) {
        console.warn(`Failed to update price for ${stock.symbol}:`, error.message);
        // Keep existing price if update fails
      }
    }
    return portfolio;
  } catch (error) {
    console.warn('Failed to update stock prices:', error.message);
    return portfolio; // Return unchanged if price update fails
  }
}

// Helper function to calculate execution price
function calculateExecutionPrice(orderType, type, currentPrice, limitPrice, stopPrice) {
  switch (orderType) {
    case 'market':
      return currentPrice;
    case 'limit':
      if (limitPrice && limitPrice > 0) {
        return parseFloat(limitPrice);
      }
      return currentPrice;
    case 'stop':
      if (stopPrice && stopPrice > 0) {
        return parseFloat(stopPrice);
      }
      return currentPrice;
    default:
      return currentPrice;
  }
}

// Enhanced buy order execution
async function executeBuyOrder(userId, symbol, quantity, executionPrice, orderType) {
  const totalCost = quantity * executionPrice;

  // Get user's portfolio
  let portfolio = await Portfolio.findOne({ userId });
  if (!portfolio) {
    portfolio = new Portfolio({
      userId,
      cashBalance: 10000,
      totalValue: 10000,
      stocks: [],
      totalPnL: 0,
      adminPnLAdjustment: 0
    });
  }

  // Check sufficient funds
  if (portfolio.cashBalance < totalCost) {
    throw new Error(`Insufficient funds. Required: $${totalCost.toFixed(2)}, Available: $${portfolio.cashBalance.toFixed(2)}`);
  }

  // Update portfolio cash balance
  portfolio.cashBalance -= totalCost;

  // Handle stock position
  const existingStock = portfolio.stocks.find(stock => stock.symbol === symbol);
  
  if (existingStock) {
    // Calculate new average price
    const totalShares = existingStock.quantity + quantity;
    const totalValue = (existingStock.quantity * existingStock.purchasePrice) + totalCost;
    existingStock.purchasePrice = totalValue / totalShares;
    existingStock.quantity = totalShares;
    existingStock.currentPrice = executionPrice;
    existingStock.lastUpdated = new Date();
  } else {
    // Add new stock position
    portfolio.stocks.push({
      symbol,
      quantity,
      purchasePrice: executionPrice,
      currentPrice: executionPrice,
      lastUpdated: new Date()
    });
  }

  // Update total value
  const stockValue = portfolio.stocks.reduce((total, stock) => {
    return total + (stock.quantity * stock.currentPrice);
  }, 0);
  portfolio.totalValue = portfolio.cashBalance + stockValue + (portfolio.adminPnLAdjustment || 0);

  await portfolio.save();

  // Create transaction record
  const transaction = new Transaction({
    userId,
    type: 'buy',
    symbol,
    quantity,
    price: executionPrice,
    totalValue: totalCost,
    orderType: orderType || 'market',
    timestamp: new Date()
  });
  await transaction.save();

  // Create trade record
  const trade = new Trade({
    user: userId,
    symbol,
    type: 'BUY',
    quantity,
    price: executionPrice,
    status: 'completed',
    pnl: 0,
    createdAt: new Date()
  });
  await trade.save();

  return {
    portfolio,
    transaction,
    trade,
    totalAmount: totalCost,
    pnl: 0,
    executionPrice,
    newBalance: portfolio.cashBalance
  };
}

// Enhanced sell order execution
async function executeSellOrder(userId, symbol, quantity, executionPrice, orderType) {
  const totalValue = quantity * executionPrice;

  // Get user's portfolio
  const portfolio = await Portfolio.findOne({ userId });
  if (!portfolio) {
    throw new Error('Portfolio not found');
  }

  // Find stock in portfolio
  const stockIndex = portfolio.stocks.findIndex(stock => stock.symbol === symbol);
  if (stockIndex === -1) {
    throw new Error(`No position found for ${symbol}`);
  }

  const stock = portfolio.stocks[stockIndex];

  // Check sufficient shares
  if (stock.quantity < quantity) {
    throw new Error(`Insufficient shares. Available: ${stock.quantity}, Requested: ${quantity}`);
  }

  // Calculate P&L
  const purchaseValue = quantity * stock.purchasePrice;
  const pnl = totalValue - purchaseValue;

  // Update portfolio
  portfolio.cashBalance += totalValue;

  if (stock.quantity === quantity) {
    // Remove entire position
    portfolio.stocks.splice(stockIndex, 1);
  } else {
    // Reduce position
    stock.quantity -= quantity;
    stock.currentPrice = executionPrice;
    stock.lastUpdated = new Date();
  }

  // Update total P&L
  portfolio.totalPnL = (portfolio.totalPnL || 0) + pnl;

  // Update total value
  const stockValue = portfolio.stocks.reduce((total, stock) => {
    return total + (stock.quantity * stock.currentPrice);
  }, 0);
  portfolio.totalValue = portfolio.cashBalance + stockValue + (portfolio.adminPnLAdjustment || 0);

  await portfolio.save();

  // Create transaction record
  const transaction = new Transaction({
    userId,
    type: 'sell',
    symbol,
    quantity,
    price: executionPrice,
    totalValue,
    orderType: orderType || 'market',
    timestamp: new Date()
  });
  await transaction.save();

  // Create trade record with P&L
  const trade = new Trade({
    user: userId,
    symbol,
    type: 'SELL',
    quantity,
    price: executionPrice,
    status: 'completed',
    pnl,
    createdAt: new Date()
  });
  await trade.save();

  return {
    portfolio,
    transaction,
    trade,
    totalAmount: totalValue,
    pnl,
    executionPrice,
    newBalance: portfolio.cashBalance
  };
}

// MAIN ORDER ENDPOINT - Unified buy/sell handler
router.post('/order', authMiddleware, async (req, res) => {
  try {
    console.log('=== TRADE ORDER DEBUG ===');
    console.log('User ID:', req.user._id);
    console.log('Request body:', req.body);

    const { symbol, type, quantity, orderType, limitPrice, stopPrice } = req.body;
    const userId = req.user._id;

    // Validate required fields
    if (!symbol || !type || !quantity) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required fields: symbol, type, quantity' 
      });
    }

    // Validate quantity
    const parsedQuantity = parseInt(quantity);
    if (parsedQuantity <= 0 || !Number.isInteger(parsedQuantity)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Quantity must be a positive integer' 
      });
    }

    // Validate trade type
    if (!['BUY', 'SELL'].includes(type.toUpperCase())) {
      return res.status(400).json({
        success: false,
        error: 'Invalid trade type. Must be BUY or SELL'
      });
    }

    // Get current stock price
    let currentPrice;
    try {
      currentPrice = await stockService.getCurrentPrice(symbol);
    } catch (error) {
      console.warn('Price service failed, using mock price:', error.message);
      currentPrice = await mockStockService.getCurrentPrice(symbol);
    }

    // Validate current price
    if (!currentPrice || currentPrice <= 0) {
      return res.status(400).json({
        success: false,
        error: `Unable to get valid price for ${symbol}`
      });
    }

    // Calculate execution price based on order type
    const executionPrice = calculateExecutionPrice(
      orderType || 'market',
      type.toUpperCase(),
      currentPrice,
      limitPrice,
      stopPrice
    );

    console.log(`Executing ${type} order: ${parsedQuantity} shares of ${symbol} at $${executionPrice}`);

    let result;

    if (type.toUpperCase() === 'BUY') {
      result = await executeBuyOrder(userId, symbol, parsedQuantity, executionPrice, orderType);
    } else if (type.toUpperCase() === 'SELL') {
      result = await executeSellOrder(userId, symbol, parsedQuantity, executionPrice, orderType);
    } else {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid order type. Must be BUY or SELL' 
      });
    }

    console.log('Trade executed successfully:', {
      symbol,
      type: type.toUpperCase(),
      quantity: parsedQuantity,
      executionPrice,
      newBalance: result.newBalance,
      pnl: result.pnl
    });

    // Return comprehensive response
    res.json({
      success: true,
      message: `${type.toUpperCase()} order executed successfully`,
      trade: {
        id: result.trade._id,
        symbol,
        type: type.toUpperCase(),
        quantity: parsedQuantity,
        price: executionPrice,
        status: 'completed',
        pnl: result.pnl || 0,
        totalAmount: result.totalAmount,
        timestamp: new Date().toISOString()
      },
      portfolio: {
        cashBalance: result.portfolio.cashBalance,
        totalValue: result.portfolio.totalValue,
        totalPnL: result.portfolio.totalPnL || 0,
        stocks: result.portfolio.stocks
      }
    });

  } catch (error) {
    console.error('Trading error:', error);
    res.status(500).json({ 
      success: false,
      error: error.message || 'Order execution failed',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// FIXED: Portfolio endpoint with proper response format
router.get('/portfolio', authMiddleware, async (req, res) => {
  try {
    console.log('=== PORTFOLIO FETCH DEBUG ===');
    console.log('User ID:', req.user._id);

    let portfolio = await Portfolio.findOne({ userId: req.user._id });
    
    if (!portfolio) {
      console.log('Creating new portfolio for user:', req.user._id);
      portfolio = new Portfolio({
        userId: req.user._id,
        cashBalance: 10000,
        totalValue: 10000,
        totalPnL: 0,
        stocks: [], // Your schema uses "stocks" array
        adminPnLAdjustment: 0
      });
      await portfolio.save();
    }

    // Update current prices for all positions
    await updateStockPrices(portfolio);

    // Calculate portfolio metrics
    const stockValue = portfolio.stocks.reduce((total, stock) => 
      total + (stock.quantity * stock.currentPrice), 0
    );
    
    const totalInvested = portfolio.stocks.reduce((total, stock) => 
      total + (stock.quantity * stock.purchasePrice), 0
    );

    // Update portfolio totals
    portfolio.totalValue = portfolio.cashBalance + stockValue + (portfolio.adminPnLAdjustment || 0);
    portfolio.totalPnL = (stockValue - totalInvested) + (portfolio.adminPnLAdjustment || 0);
    
    await portfolio.save();

    // FIXED: Return response matching your frontend expectations exactly
    res.json({
      success: true,
      portfolio: {
        userId: portfolio.userId,
        cashBalance: portfolio.cashBalance,
        totalValue: portfolio.totalValue,
        totalPnL: portfolio.totalPnL,
        stocks: portfolio.stocks, // Keep "stocks" array as per your schema
        stocksCount: portfolio.stocks.length,
        lastUpdated: portfolio.updatedAt || new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Portfolio error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch portfolio'
    });
  }
});

// WALLET ENDPOINT - Enhanced
router.get('/wallet', authMiddleware, async (req, res) => {
  try {
    console.log('=== WALLET FETCH DEBUG ===');
    console.log('User ID:', req.user._id);

    const portfolio = await Portfolio.findOne({ userId: req.user._id });
    
    if (!portfolio) {
      return res.json({
        success: true,
        balance: 10000,
        availableBalance: 10000,
        totalValue: 10000,
        totalPnL: 0,
        investedAmount: 0
      });
    }

    // Calculate invested amount
    const investedAmount = portfolio.stocks.reduce((total, stock) => {
      return total + (stock.quantity * stock.purchasePrice);
    }, 0);

    // Calculate current stock value
    const stockValue = portfolio.stocks.reduce((total, stock) => {
      return total + (stock.quantity * stock.currentPrice);
    }, 0);

    res.json({
      success: true,
      balance: portfolio.cashBalance,
      availableBalance: portfolio.cashBalance,
      totalValue: portfolio.totalValue || (portfolio.cashBalance + stockValue),
      totalPnL: portfolio.totalPnL || 0,
      investedAmount,
      stockValue,
      positions: portfolio.stocks.length
    });

  } catch (error) {
    console.error('Wallet error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch wallet balance'
    });
  }
});

// QUICK STATS ENDPOINT - For navbar display
router.get('/quick-stats', authMiddleware, async (req, res) => {
  try {
    const portfolio = await Portfolio.findOne({ userId: req.user._id });
    
    if (!portfolio) {
      return res.json({
        success: true,
        quickStats: {
          balance: 10000,
          totalValue: 10000,
          todayPnL: 0,
          totalTrades: 0,
          activePositions: 0
        },
        systemStatus: {
          marketOpen: true,
          activeUsers: 1247
        },
        notifications: {
          unread: 0,
          latest: []
        }
      });
    }

    const totalTrades = await Transaction.countDocuments({ userId: req.user._id });
    
    res.json({
      success: true,
      quickStats: {
        balance: portfolio.cashBalance,
        totalValue: portfolio.totalValue || portfolio.cashBalance,
        todayPnL: portfolio.totalPnL || 0,
        totalTrades,
        activePositions: portfolio.stocks.length
      },
      systemStatus: {
        marketOpen: true,
        activeUsers: Math.floor(Math.random() * 1000) + 1000
      },
      notifications: {
        unread: 0,
        latest: []
      }
    });

  } catch (error) {
    console.error('Quick stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch quick stats'
    });
  }
});

// TRADING HISTORY ENDPOINT
router.get('/history', authMiddleware, async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const userId = req.user._id;
    
    console.log(`📜 Fetching trading history for user: ${userId}`);
    
    // Get transactions
    const transactions = await Transaction.find({ userId })
      .sort({ timestamp: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit))
      .lean();

    // Get trades
    const trades = await Trade.find({ user: userId })
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit))
      .lean();

    const totalTransactions = await Transaction.countDocuments({ userId });
    const totalTrades = await Trade.countDocuments({ user: userId });

    res.json({
      success: true,
      history: transactions.map(tx => ({
        id: tx._id,
        type: tx.type,
        symbol: tx.symbol,
        quantity: tx.quantity,
        price: tx.price,
        totalValue: tx.totalValue,
        orderType: tx.orderType,
        timestamp: tx.timestamp || tx.createdAt,
        status: 'completed'
      })),
      trades: trades.map(trade => ({
        id: trade._id,
        symbol: trade.symbol,
        type: trade.type,
        quantity: trade.quantity,
        price: trade.price,
        status: trade.status,
        pnl: trade.pnl,
        createdAt: trade.createdAt
      })),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalTransactions,
        pages: Math.ceil(totalTransactions / parseInt(limit))
      }
    });
    
  } catch (error) {
    console.error('Trading history error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch trading history'
    });
  }
});

// POSITIONS ENDPOINT
router.get('/positions', authMiddleware, async (req, res) => {
  try {
    const portfolio = await Portfolio.findOne({ userId: req.user._id });
    
    if (!portfolio || !portfolio.stocks.length) {
      return res.json({
        success: true,
        positions: []
      });
    }

    // Update prices and calculate positions
    await updateStockPrices(portfolio);
    
    const positions = portfolio.stocks.map(stock => {
      const marketValue = stock.quantity * stock.currentPrice;
      const bookValue = stock.quantity * stock.purchasePrice;
      const unrealizedPnL = marketValue - bookValue;
      const unrealizedPnLPercent = (unrealizedPnL / bookValue) * 100;

      return {
        symbol: stock.symbol,
        quantity: stock.quantity,
        purchasePrice: stock.purchasePrice,
        currentPrice: stock.currentPrice,
        marketValue,
        unrealizedPnL,
        unrealizedPnLPercent,
        lastUpdated: stock.lastUpdated
      };
    });

    res.json({
      success: true,
      positions
    });

  } catch (error) {
    console.error('Positions error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch positions'
    });
  }
});

// HEALTH CHECK ENDPOINT
router.get('/health', (req, res) => {
  res.json({
    success: true,
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    endpoints: [
      'POST /order - Execute buy/sell orders',
      'GET /portfolio - Get portfolio data',
      'GET /wallet - Get wallet balance',
      'GET /quick-stats - Get navbar stats',
      'GET /history - Get trading history',
      'GET /positions - Get current positions',
      'GET /health - Health check'
    ]
  });
});

module.exports = router;
