const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const Portfolio = require('../models/Portfolio');
const Transaction = require('../models/Transaction');
const Trade = require('../models/Trade');

// Mock stock service for quick stats
const mockStockService = {
  getMarketSummary: () => ({
    totalMarketCap: 2.1e12,
    totalVolume: 45.6e9,
    activeCryptos: 12847,
    marketChange: 2.34
  })
};

// FIXED: Complete price update function with proper closing braces
async function updateStockPrices(portfolio) {
  try {
    const mockPrices = {
      'AAPL': 185.25, 'GOOGL': 142.86, 'MSFT': 378.91, 'TSLA': 248.42,
      'NVDA': 895.23, 'AMZN': 145.67, 'META': 312.89, 'BTC-USD': 45678.90,
      'JPM': 145.32, 'JNJ': 167.45, 'NFLX': 425.30, 'DIS': 95.40
    };

    for (const stock of portfolio.stocks) {
      const basePrice = mockPrices[stock.symbol] || stock.currentPrice || stock.purchasePrice;
      const variation = (Math.random() - 0.5) * 0.02;
      stock.currentPrice = parseFloat((basePrice * (1 + variation)).toFixed(2));
      stock.lastUpdated = new Date();
    }
    
    return portfolio;
  } catch (error) {
    console.warn('Failed to update stock prices:', error.message);
    return portfolio;
  }
} 

// FIXED: Enhanced getAllDashboardData function
async function getAllDashboardData(req, res, userId) {
  try {
    console.log('📊 Fetching all dashboard data for user:', userId);

    // Fetch portfolio
    let portfolio = await Portfolio.findOne({ userId });
    if (!portfolio) {
      portfolio = new Portfolio({
        userId,
        cashBalance: 10000,
        totalValue: 10000,
        totalPnL: 0,
        stocks: [],
        adminPnLAdjustment: 0
      });
      await portfolio.save();
    }

    // Update current stock prices
    await updateStockPrices(portfolio);

    // Calculate portfolio metrics
    const stockValue = portfolio.stocks.reduce((total, stock) => 
      total + (stock.quantity * stock.currentPrice), 0
    );
    
    const totalInvested = portfolio.stocks.reduce((total, stock) => 
      total + (stock.quantity * stock.purchasePrice), 0
    );

    portfolio.totalValue = portfolio.cashBalance + stockValue + (portfolio.adminPnLAdjustment || 0);
    portfolio.totalPnL = (stockValue - totalInvested) + (portfolio.adminPnLAdjustment || 0);
    
    await portfolio.save();

    // Get recent transactions
    const recentTransactions = await Transaction.find({ userId })
      .sort({ timestamp: -1 })
      .limit(10)
      .lean();

    // Get recent trades
    const recentTrades = await Trade.find({ user: userId })
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    // Get actual total trade count
    const totalTradesCount = await Transaction.countDocuments({ userId });

    // Mock market data
    const marketSummary = mockStockService.getMarketSummary();

    // FIXED: Mock watchlist with consistent field names
    const mockWatchlist = [
      { symbol: 'AAPL', name: 'Apple Inc.', price: 185.25, changeAmount: 2.15, changePercent: 1.17, volume: '45.6M' },
      { symbol: 'GOOGL', name: 'Alphabet Inc.', price: 142.86, changeAmount: -1.24, changePercent: -0.86, volume: '28.9M' },
      { symbol: 'MSFT', name: 'Microsoft Corp.', price: 378.91, changeAmount: 4.56, changePercent: 1.22, volume: '32.1M' },
      { symbol: 'TSLA', name: 'Tesla Inc.', price: 248.42, changeAmount: -3.28, changePercent: -1.30, volume: '89.7M' },
      { symbol: 'NVDA', name: 'NVIDIA Corp.', price: 895.23, changeAmount: 12.45, changePercent: 1.41, volume: '78.9M' }
    ];

    // Enhanced response format
    const dashboardData = {
      success: true,
        portfolio: {
          userId: portfolio.userId,
          cashBalance: portfolio.cashBalance,
          totalValue: portfolio.totalValue,
          totalPnL: portfolio.totalPnL,
          stocks: portfolio.stocks,
          stocksCount: portfolio.stocks.length,
          lastUpdated: portfolio.updatedAt || new Date().toISOString()
        },
        overview: {
          totalBalance: portfolio.totalValue,
          todayPnL: portfolio.totalPnL || 0,
          todayPnLPercent: portfolio.totalValue > 0 ? ((portfolio.totalPnL || 0) / portfolio.totalValue * 100).toFixed(2) : 0,
          weeklyPnL: portfolio.totalPnL || 0,
          weeklyPnLPercent: 0,
          totalProfit: portfolio.totalPnL || 0,
          totalTrades: totalTradesCount,
          winRate: 85.5,
          investedAmount: totalInvested,
          availableBalance: portfolio.cashBalance,
          history: Array.from({length: 30}, () => Math.random() * 1000 + 9000)
        },
        quickStats: {
          balance: portfolio.cashBalance,
          totalValue: portfolio.totalValue,
          todayPnL: portfolio.totalPnL || 0,
          totalTrades: totalTradesCount,
          activePositions: portfolio.stocks.length
        },
        watchlist: mockWatchlist,
        recentTransactions: recentTransactions.map(tx => ({
          id: tx._id,
          type: tx.type,
          symbol: tx.symbol || 'N/A',
          quantity: tx.quantity || 0,
          price: tx.price || 0,
          totalValue: tx.totalValue || 0,
          timestamp: tx.timestamp || tx.createdAt,
          status: 'completed'
        })),
        trades: recentTrades.map(trade => ({
          _id: trade._id,
          symbol: trade.symbol,
          type: trade.type,
          quantity: trade.quantity,
          price: trade.price,
          pnl: trade.pnl || 0,
          createdAt: trade.createdAt,
          status: trade.status || 'completed'
        })),
        market: Array.from({length: 24}, (_, i) => ({
          time: new Date(Date.now() - (23 - i) * 60 * 60 * 1000).toISOString(),
          value: parseFloat((Math.random() * 1000 + 4000).toFixed(2))
        })),
        marketSummary
      
    };

    res.json(dashboardData);

  } catch (error) {
    console.error('Dashboard data error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch dashboard data',
      details: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
}

// Main dashboard route
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { endpoint } = req.query;
    const userId = req.user._id;

    console.log('📊 Dashboard request:', { endpoint, userId });

    switch (endpoint) {
      case 'all':
        return await getAllDashboardData(req, res, userId);
      
      case 'portfolio':
        const portfolio = await Portfolio.findOne({ userId });
        if (!portfolio) {
          const newPortfolio = new Portfolio({
            userId,
            cashBalance: 0,
            totalValue: 0,
            totalPnL: 0,
            stocks: [],
            adminPnLAdjustment: 0
          });
          await newPortfolio.save();
          return res.json({
            success: true,
            portfolio: { stocks: [], cashBalance: 0 }
          });
        }
        return res.json({
          success: true,
          portfolio: portfolio
        });
      
      case 'transactions':
        const transactions = await Transaction.find({ userId })
          .sort({ timestamp: -1 })
          .limit(20);
        return res.json({
          success: true,
          transactions: transactions
        });
      
      default:
        return await getAllDashboardData(req, res, userId);
    }

  } catch (error) {
    console.error('Dashboard API error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.message : 'Server error'
    });
  }
});

module.exports = router;
