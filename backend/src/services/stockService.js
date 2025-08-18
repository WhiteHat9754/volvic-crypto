// services/stockService.js
const StockDataService = require('./stockDataService');
const StockCache = require('../models/StockCache');

class StockService {
  constructor() {
    this.stockDataService = new StockDataService();
  }

  // This is the function your trading routes are calling
  async getStockQuote(symbol) {
    try {
      // First try to get from your MongoDB cache (fastest)
      const cachedStock = await StockCache.findOne({ 
        symbol: symbol.toUpperCase(), 
        isActive: true 
      });

      if (cachedStock) {
        // Return in expected format for your trading routes
        return {
          c: cachedStock.price, // current price
          h: cachedStock.price + (Math.random() * 2), // high (can be enhanced)
          l: cachedStock.price - (Math.random() * 2), // low (can be enhanced)
          o: cachedStock.price, // open (can be enhanced)
          pc: cachedStock.price - cachedStock.changeAmount, // previous close
          v: cachedStock.volume || 0 // volume
        };
      }

      // Fallback to Yahoo Finance if not in cache
      const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1m&range=1d`;
      const axios = require('axios');
      
      const response = await axios.get(url, {
        timeout: 10000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });
      
      if (response.data && response.data.chart && response.data.chart.result) {
        const chart = response.data.chart.result[0];
        const meta = chart.meta;
        
        return {
          c: meta.regularMarketPrice,
          h: meta.regularMarketDayHigh || meta.regularMarketPrice,
          l: meta.regularMarketDayLow || meta.regularMarketPrice,
          o: meta.regularMarketOpen || meta.regularMarketPrice,
          pc: meta.previousClose,
          v: meta.regularMarketVolume || 0
        };
      }
      
      throw new Error(`No price data found for ${symbol}`);
      
    } catch (error) {
      console.error(`StockService getStockQuote error for ${symbol}:`, error);
      throw error;
    }
  }

  // In stockService.js
convertToCandlestick(rawData) {
  return rawData.map(item => ({
    time: new Date(item.timestamp || item.date).getTime(),
    open: parseFloat(item.open),
    high: parseFloat(item.high),
    low: parseFloat(item.low),
    close: parseFloat(item.close),
    volume: parseInt(item.volume || 0)
  }));
}


  // Additional helper methods
  async getCurrentPrice(symbol) {
    try {
      const quote = await this.getStockQuote(symbol);
      return quote.c;
    } catch (error) {
      return null;
    }
  }

  async searchStocks(query) {
    return await this.stockDataService.searchStocksFromYahoo(query);
  }
}

module.exports = new StockService();
