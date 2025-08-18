// backgroundTasks/stockDataFetcher.js
const cron = require('node-cron');
const StockDataService = require('../src/services/stockDataService');
const StockCache = require('../src/models/StockCache');
const StockPriceHistory = require('../src/models/StockPriceHistory');

class MongoStockDataFetcher {
  constructor() {
    this.dataService = new StockDataService();
    this.isRunning = false;
    this.symbols = this.dataService.getStockSymbolList();
    
    console.log('🔧 MongoDB Stock Data Fetcher initialized');
  }

  async startFetching() {
    console.log('🚀 Starting MongoDB stock data fetcher...');
    
    // Initialize database with stock symbols
    await this.initializeStockDatabase();
    
    // High-priority stocks every 1 minute
    cron.schedule('* * * * *', async () => {
      if (!this.isRunning) {
        this.isRunning = true;
        await this.fetchAndCacheStocks(this.symbols.topStocks, 1, 'HIGH PRIORITY');
        this.isRunning = false;
      }
    });

    // Popular stocks every 5 minutes
    cron.schedule('*/5 * * * *', async () => {
      if (!this.isRunning) {
        await this.fetchAndCacheStocks(this.symbols.popularStocks, 2, 'POPULAR');
      }
    });

    // Crypto stocks every 2 minutes
    cron.schedule('*/2 * * * *', async () => {
      if (!this.isRunning) {
        await this.fetchAndCacheStocks(this.symbols.cryptoStocks, 1, 'CRYPTO');
      }
    });

    // Database cleanup every hour
    cron.schedule('0 * * * *', async () => {
      await this.cleanupOldData();
    });

    console.log('✅ Stock data fetcher scheduled and running');
  }

  async initializeStockDatabase() {
    try {
      const allSymbols = [
        ...this.symbols.topStocks,
        ...this.symbols.popularStocks,
        ...this.symbols.cryptoStocks
      ];

      // Create stock entries if they don't exist
      for (const symbol of allSymbols) {
        const priority = this.symbols.topStocks.includes(symbol) ? 1 : 
                        this.symbols.cryptoStocks.includes(symbol) ? 1 : 2;
        
        await StockCache.findOneAndUpdate(
          { symbol: symbol },
          { 
            symbol: symbol,
            name: symbol,
            price: 0,
            changeAmount: 0,
            changePercent: 0,
            volume: 0,
            fetchPriority: priority,
            isActive: true
          },
          { upsert: true, new: true }
        );
      }

      console.log(`✅ Initialized ${allSymbols.length} stocks in database`);
    } catch (error) {
      console.error('❌ Error initializing database:', error);
    }
  }

  async fetchAndCacheStocks(symbols, priority, label) {
    try {
      console.log(`📊 Fetching ${label} stocks: ${symbols.length} symbols`);
      
      const stockData = await this.dataService.fetchYahooFinanceData(symbols);
      
      if (stockData.length > 0) {
        await this.batchUpdateMongoDB(stockData, priority);
        console.log(`✅ Updated ${stockData.length} ${label} stocks in MongoDB`);
      }
    } catch (error) {
      console.error(`❌ Error in fetchAndCacheStocks (${label}):`, error);
    }
  }

  async batchUpdateMongoDB(stockData, priority) {
    try {
      // Use MongoDB bulk operations for better performance
      const bulkOps = stockData.map(stock => ({
        updateOne: {
          filter: { symbol: stock.symbol },
          update: {
            $set: {
              name: stock.name,
              price: stock.price,
              changeAmount: stock.changeAmount,
              changePercent: stock.changePercent,
              volume: stock.volume,
              marketCap: stock.marketCap,
              fetchPriority: priority,
              lastUpdated: new Date(),
              source: stock.source,
              isActive: true
            }
          },
          upsert: true
        }
      }));

      // Execute bulk update
      if (bulkOps.length > 0) {
        await StockCache.bulkWrite(bulkOps, { ordered: false });
      }

      // Store price history for charting
      const historyOps = stockData.map(stock => ({
        symbol: stock.symbol,
        price: stock.price,
        volume: stock.volume,
        timestamp: new Date()
      }));

      if (historyOps.length > 0) {
        await StockPriceHistory.insertMany(historyOps, { ordered: false });
      }

    } catch (error) {
      console.error('❌ MongoDB bulk update error:', error);
    }
  }

  async cleanupOldData() {
    try {
      // Remove price history older than 30 days
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const deleteResult = await StockPriceHistory.deleteMany({
        timestamp: { $lt: thirtyDaysAgo }
      });

      console.log(`🧹 Cleaned up ${deleteResult.deletedCount} old price history records`);
    } catch (error) {
      console.error('❌ Cleanup error:', error);
    }
  }
}

module.exports = MongoStockDataFetcher;
