// services/stockDataService.js
const axios = require('axios');

class StockDataService {
  constructor() {
    this.sources = {
      yahoo: {
        baseUrl: 'https://query1.finance.yahoo.com/v8/finance/chart/',
        rateLimit: 100, // milliseconds between requests
        maxRetries: 3
      },
      yahoo_search: {
        baseUrl: 'https://query1.finance.yahoo.com/v1/finance/search',
        rateLimit: 200
      }
    };
  }

  // Fetch data from Yahoo Finance (no API key required)
  async fetchYahooFinanceData(symbols) {
    const results = [];
    
    console.log(`📊 Fetching data for ${symbols.length} symbols from Yahoo Finance`);
    
    for (let i = 0; i < symbols.length; i++) {
      const symbol = symbols[i];
      
      try {
        const url = `${this.sources.yahoo.baseUrl}${symbol}?interval=1m&range=1d`;
        const response = await axios.get(url, {
          timeout: 10000,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          }
        });
        
        if (response.data && response.data.chart && response.data.chart.result) {
          const stockData = this.parseYahooData(response.data, symbol);
          if (stockData) {
            results.push(stockData);
            console.log(`✅ Fetched ${symbol}: $${stockData.price}`);
          }
        }
      } catch (error) {
        console.error(`❌ Error fetching ${symbol}:`, error.message);
      }
      
      // Rate limiting to avoid being blocked
      if (i < symbols.length - 1) {
        await new Promise(resolve => setTimeout(resolve, this.sources.yahoo.rateLimit));
      }
    }
    
    console.log(`📈 Successfully fetched ${results.length}/${symbols.length} stocks`);
    return results;
  }

  parseYahooData(data, symbol) {
    try {
      const chart = data.chart.result[0];
      const meta = chart.meta;
      
      if (!meta.regularMarketPrice) {
        console.warn(`⚠️ No price data for ${symbol}`);
        return null;
      }

      const change = meta.regularMarketPrice - meta.previousClose;
      const changePercent = (change / meta.previousClose) * 100;
      
      return {
        symbol: symbol.toUpperCase(),
        name: meta.longName || meta.shortName || symbol,
        price: parseFloat(meta.regularMarketPrice.toFixed(4)),
        changeAmount: parseFloat(change.toFixed(4)),
        changePercent: parseFloat(changePercent.toFixed(2)),
        volume: meta.regularMarketVolume || 0,
        marketCap: meta.marketCap || null,
        lastUpdated: new Date(),
        source: 'yahoo_finance'
      };
    } catch (error) {
      console.error(`Error parsing data for ${symbol}:`, error);
      return null;
    }
  }

  // Search for stocks using Yahoo Finance search
  async searchStocksFromYahoo(query) {
    try {
      const url = `${this.sources.yahoo_search.baseUrl}?q=${encodeURIComponent(query)}`;
      const response = await axios.get(url, {
        timeout: 5000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });

      if (response.data && response.data.quotes) {
        return response.data.quotes
          .filter(quote => quote.typeDisp === 'Equity')
          .map(quote => ({
            symbol: quote.symbol,
            name: quote.longname || quote.shortname,
            exchange: quote.exchange,
            type: 'Stock'
          }))
          .slice(0, 50);
      }
    } catch (error) {
      console.error('Yahoo search error:', error.message);
    }
    
    return [];
  }

  // Get comprehensive stock list (major exchanges)
  getStockSymbolList() {
    return {
      topStocks: [
        'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'NVDA', 'META', 'BRK-B', 
        'JNJ', 'V', 'WMT', 'JPM', 'PG', 'UNH', 'HD', 'MA', 'DIS', 'PYPL',
        'NFLX', 'ADBE', 'CRM', 'BABA', 'PFE', 'KO', 'PEP', 'ORCL'
      ],
      popularStocks: [
        'SPY', 'QQQ', 'IWM', 'GLD', 'SLV', 'UBER', 'LYFT', 'SNAP', 'TWTR',
        'AMD', 'INTC', 'CSCO', 'IBM', 'QCOM', 'TXN', 'AVGO', 'MU', 'LRCX',
        'BAC', 'WFC', 'GS', 'MS', 'C', 'AXP', 'COF', 'USB', 'PNC', 'TFC'
      ],
      cryptoStocks: [
        'BTC-USD', 'ETH-USD', 'BNB-USD', 'ADA-USD', 'SOL-USD', 'XRP-USD',
        'DOT-USD', 'DOGE-USD', 'AVAX-USD', 'LUNA-USD'
      ]
    };
  }
}

module.exports = StockDataService;
