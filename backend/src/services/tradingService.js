// services/tradingService.js - Adapted for your schemas
const Trade = require('../models/Trade');
const Portfolio = require('../models/Portfolio');
const User = require('../models/User');
const StockCache = require('../models/StockCache');
const mongoose = require('mongoose');

class TradingService {
  constructor() {
    this.tradingFeePercent = 0.001; // 0.1% trading fee
  }

  async executeTrade(userId, tradeData) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const { symbol, type, quantity, orderType, limitPrice, stopPrice } = tradeData;

      // 1. Get current market price
      const currentPrice = await this.getCurrentPrice(symbol);
      if (!currentPrice) {
        throw new Error('Unable to get current market price');
      }

      // 2. Determine execution price
      let executionPrice = this.calculateExecutionPrice(
        orderType, type, currentPrice, limitPrice, stopPrice
      );

      const totalAmount = quantity * executionPrice;
      const fees = totalAmount * this.tradingFeePercent;

      // 3. Get or create user portfolio
      let portfolio = await Portfolio.findOne({ userId }).session(session);
      if (!portfolio) {
        portfolio = new Portfolio({ userId });
        await portfolio.save({ session });
      }

      // 4. Execute trade based on type
      let trade, pnl = 0;

      if (type.toUpperCase() === 'BUY') {
        trade = await this.executeBuyOrder(
          userId, portfolio, symbol, quantity, executionPrice, totalAmount, fees, session
        );
      } else {
        const result = await this.executeSellOrder(
          userId, portfolio, symbol, quantity, executionPrice, totalAmount, fees, session
        );
        trade = result.trade;
        pnl = result.pnl;
      }

      await session.commitTransaction();

      // Get updated portfolio
      const updatedPortfolio = await Portfolio.findOne({ userId });

      return {
        trade,
        executionPrice,
        fees,
        pnl,
        newBalance: updatedPortfolio.cashBalance,
        totalValue: updatedPortfolio.totalValue
      };

    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  calculateExecutionPrice(orderType, type, currentPrice, limitPrice, stopPrice) {
    switch (orderType) {
      case 'market':
        return currentPrice;
      case 'limit':
        if (type === 'BUY' && limitPrice < currentPrice) {
          throw new Error('Limit price too low for buy order');
        }
        if (type === 'SELL' && limitPrice > currentPrice) {
          throw new Error('Limit price too high for sell order');
        }
        return limitPrice;
      case 'stop':
        return stopPrice;
      default:
        return currentPrice;
    }
  }

  async executeBuyOrder(userId, portfolio, symbol, quantity, price, totalAmount, fees, session) {
    const finalCost = totalAmount + fees;

    // Check sufficient balance
    if (portfolio.cashBalance < finalCost) {
      throw new Error(`Insufficient balance. Required: $${finalCost.toFixed(2)}, Available: $${portfolio.cashBalance.toFixed(2)}`);
    }

    // Update portfolio
    const existingStock = portfolio.stocks.find(stock => stock.symbol === symbol);
    
    if (existingStock) {
      // Update existing position - calculate new average price
      const totalQuantity = existingStock.quantity + quantity;
      const totalCost = (existingStock.quantity * existingStock.purchasePrice) + totalAmount;
      const newAveragePrice = totalCost / totalQuantity;
      
      existingStock.quantity = totalQuantity;
      existingStock.purchasePrice = newAveragePrice;
      existingStock.currentPrice = price;
      existingStock.lastUpdated = new Date();
    } else {
      // Add new position
      portfolio.stocks.push({
        symbol,
        quantity,
        purchasePrice: price,
        currentPrice: price,
        lastUpdated: new Date()
      });
    }

    // Deduct from cash balance
    portfolio.cashBalance -= finalCost;
    await portfolio.save({ session });

    // Create trade record
    const trade = new Trade({
      user: userId,
      symbol,
      type: 'BUY',
      quantity,
      price,
      status: 'completed',
      pnl: 0 // No P&L on buy orders
    });
    
    return await trade.save({ session });
  }

  async executeSellOrder(userId, portfolio, symbol, quantity, price, totalAmount, fees, session) {
    // Find the stock position
    const stockIndex = portfolio.stocks.findIndex(stock => stock.symbol === symbol);
    
    if (stockIndex === -1) {
      throw new Error(`No position found for ${symbol}`);
    }

    const stock = portfolio.stocks[stockIndex];
    
    if (stock.quantity < quantity) {
      throw new Error(`Insufficient shares. Available: ${stock.quantity}, Requested: ${quantity}`);
    }

    // Calculate P&L
    const purchaseValue = quantity * stock.purchasePrice;
    const saleValue = totalAmount - fees;
    const pnl = saleValue - purchaseValue;

    // Update portfolio
    if (stock.quantity === quantity) {
      // Selling entire position
      portfolio.stocks.splice(stockIndex, 1);
    } else {
      // Partial sale - reduce quantity but keep same average price
      stock.quantity -= quantity;
      stock.currentPrice = price;
      stock.lastUpdated = new Date();
    }

    // Add proceeds to cash balance
    portfolio.cashBalance += saleValue;
    portfolio.totalPnL += pnl;
    
    await portfolio.save({ session });

    // Create trade record
    const trade = new Trade({
      user: userId,
      symbol,
      type: 'SELL',
      quantity,
      price,
      status: 'completed',
      pnl
    });
    
    await trade.save({ session });

    return { trade, pnl };
  }

  async getCurrentPrice(symbol) {
    try {
      const stockData = await StockCache.findOne({ 
        symbol: symbol.toUpperCase(), 
        isActive: true 
      });
      return stockData ? stockData.price : null;
    } catch (error) {
      console.error('Error getting current price:', error);
      return null;
    }
  }

  async getUserPortfolio(userId) {
    const portfolio = await Portfolio.findOne({ userId }).populate('userId', 'name email');
    
    if (!portfolio) {
      // Create default portfolio if it doesn't exist
      const newPortfolio = new Portfolio({ userId });
      return await newPortfolio.save();
    }

    // Update current prices for all positions
    for (let stock of portfolio.stocks) {
      const currentPrice = await this.getCurrentPrice(stock.symbol);
      if (currentPrice && currentPrice !== stock.currentPrice) {
        stock.currentPrice = currentPrice;
        stock.lastUpdated = new Date();
      }
    }

    // Calculate total P&L including unrealized gains/losses
    let unrealizedPnL = 0;
    for (let stock of portfolio.stocks) {
      const unrealizedGain = (stock.currentPrice - stock.purchasePrice) * stock.quantity;
      unrealizedPnL += unrealizedGain;
    }

    portfolio.totalPnL = await this.getRealizedPnL(userId) + unrealizedPnL;
    await portfolio.save();

    return portfolio;
  }

  async getRealizedPnL(userId) {
    const result = await Trade.aggregate([
      { $match: { user: new mongoose.Types.ObjectId(userId), type: 'SELL' } },
      { $group: { _id: null, totalPnL: { $sum: '$pnl' } } }
    ]);
    
    return result.length > 0 ? result[0].totalPnL : 0;
  }

  async getUserTrades(userId, limit = 50, page = 1) {
    const skip = (page - 1) * limit;
    
    const trades = await Trade.find({ user: userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('user', 'name email')
      .lean();

    const total = await Trade.countDocuments({ user: userId });

    return {
      trades,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  async getPortfolioStats(userId) {
    const portfolio = await this.getUserPortfolio(userId);
    const trades = await Trade.find({ user: userId }).lean();
    
    const stockValue = portfolio.stocks.reduce((total, stock) => {
      return total + (stock.quantity * stock.currentPrice);
    }, 0);

    const totalInvested = trades
      .filter(trade => trade.type === 'BUY')
      .reduce((sum, trade) => sum + (trade.quantity * trade.price), 0);

    return {
      cashBalance: portfolio.cashBalance,
      stockValue,
      totalValue: portfolio.totalValue,
      totalPnL: portfolio.totalPnL,
      totalInvested,
      positions: portfolio.stocks.length,
      totalTrades: trades.length
    };
  }
}

module.exports = TradingService;
