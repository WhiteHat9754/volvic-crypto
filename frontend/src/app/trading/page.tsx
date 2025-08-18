'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useSocket } from '@/contexts/SocketContext';
import { useRouter } from 'next/navigation';
import { useDebounce } from 'use-debounce';
import CandlestickChart from '@/components/CandlestickChart';
import {
  TrendingUp, TrendingDown, Search, Star, Plus, Minus,
  ArrowUpRight, ArrowDownRight, Bell, AlertCircle, 
  Maximize2, Minimize2, Volume2, Zap,
  Target, Shield, Wifi, WifiOff, RefreshCw, Filter,
  ChevronUp, ChevronDown, Activity, DollarSign,
  Clock, Eye, EyeOff, Settings, Menu, X, Wallet
} from 'lucide-react';

// TypeScript interfaces matching your backend exactly
interface Stock {
  symbol: string;
  name: string;
  price: number;
  changeAmount: number;
  changePercent: number;
  volume: number;
  marketCap?: number;
  lastUpdated?: string;
  source: string;
}

interface SearchResult {
  symbol: string;
  name: string;
  type: string;
  exchange: string;
}

// Portfolio interface matching your backend schema exactly
interface Portfolio {
  userId: string;
  cashBalance: number;
  totalValue: number;
  totalPnL: number;
  stocks: StockPosition[]; // Your backend uses "stocks" array
  stocksCount?: number;
  lastUpdated?: string;
}

interface StockPosition {
  symbol: string;
  quantity: number;
  purchasePrice: number;
  currentPrice: number;
  lastUpdated: string;
}

interface DisplayPosition extends StockPosition {
  unrealizedPnL: number;
  unrealizedPnLPercent: number;
  marketValue: number;
}

interface TradingData {
  portfolio: Portfolio | null;
  userBalance: number;
  stats?: any;
}

// FIXED StockAPI - Clean implementation
class StockAPI {
  private baseUrl: string;

  constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
  }

  async searchStocks(query: string): Promise<SearchResult[]> {
    if (!query || query.length < 2) return [];

    try {
      const response = await fetch(`${this.baseUrl}/api/stocks/search?q=${encodeURIComponent(query)}`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        return Array.isArray(data) ? data : [];
      }
    } catch (error) {
      console.error('❌ Stock search error:', error);
    }

    return this.getMockSearchResults(query);
  }

  async getTopStocks(): Promise<Stock[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/stocks/top`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        return Array.isArray(data) ? data : [];
      }
    } catch (error) {
      console.error('❌ Top stocks error:', error);
    }

    return this.getMockTopStocks();
  }

  async getCandlestickData(symbol: string, timeframe: string = '1D'): Promise<any> {
    if (!symbol) return [];

    try {
      const response = await fetch(
        `${this.baseUrl}/api/stocks/${encodeURIComponent(symbol)}/candlestick?timeframe=${timeframe}`,
        {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.ok) {
        const responseData = await response.json();
        return responseData;
      }
    } catch (error) {
      console.error('❌ Candlestick data error:', error);
    }

    return {
      success: true,
      symbol: symbol.toUpperCase(),
      timeframe,
      dataPoints: 30,
      data: this.getMockCandlestickData(timeframe),
      metadata: {
        fetchedAt: new Date().toISOString(),
        dataSource: 'mock',
        requestedTimeframe: timeframe
      }
    };
  }

  private getMockSearchResults(query: string): SearchResult[] {
    const allStocks = [
      { symbol: 'AAPL', name: 'Apple Inc.', type: 'Stock', exchange: 'NASDAQ' },
      { symbol: 'GOOGL', name: 'Alphabet Inc.', type: 'Stock', exchange: 'NASDAQ' },
      { symbol: 'MSFT', name: 'Microsoft Corporation', type: 'Stock', exchange: 'NASDAQ' },
      { symbol: 'TSLA', name: 'Tesla Inc.', type: 'Stock', exchange: 'NASDAQ' },
      { symbol: 'NVDA', name: 'NVIDIA Corporation', type: 'Stock', exchange: 'NASDAQ' },
      { symbol: 'AMZN', name: 'Amazon.com Inc.', type: 'Stock', exchange: 'NASDAQ' },
      { symbol: 'META', name: 'Meta Platforms Inc.', type: 'Stock', exchange: 'NASDAQ' },
      { symbol: 'BTC-USD', name: 'Bitcoin USD', type: 'Crypto', exchange: 'Crypto' },
    ];

    return allStocks.filter(stock => 
      stock.symbol.toLowerCase().includes(query.toLowerCase()) ||
      stock.name.toLowerCase().includes(query.toLowerCase())
    );
  }

  private getMockTopStocks(): Stock[] {
    return [
      { symbol: 'AAPL', name: 'Apple Inc.', price: 185.25, changeAmount: 2.15, changePercent: 1.17, volume: 45600000, source: 'mock' },
      { symbol: 'GOOGL', name: 'Alphabet Inc.', price: 142.86, changeAmount: -1.24, changePercent: -0.86, volume: 28900000, source: 'mock' },
      { symbol: 'MSFT', name: 'Microsoft Corp.', price: 378.91, changeAmount: 4.56, changePercent: 1.22, volume: 32100000, source: 'mock' },
      { symbol: 'TSLA', name: 'Tesla Inc.', price: 248.42, changeAmount: -3.28, changePercent: -1.30, volume: 89700000, source: 'mock' },
      { symbol: 'NVDA', name: 'NVIDIA Corp.', price: 895.23, changeAmount: 12.45, changePercent: 1.41, volume: 78900000, source: 'mock' },
      { symbol: 'AMZN', name: 'Amazon Inc.', price: 145.67, changeAmount: 3.21, changePercent: 2.25, volume: 52300000, source: 'mock' },
      { symbol: 'META', name: 'Meta Platforms', price: 312.89, changeAmount: -2.45, changePercent: -0.77, volume: 34800000, source: 'mock' },
      { symbol: 'BTC-USD', name: 'Bitcoin', price: 45678.90, changeAmount: 1234.56, changePercent: 2.78, volume: 2100000000, source: 'mock' },
    ];
  }

private getMockCandlestickData(timeframe: string = '1D') {
  const data = [];
  let basePrice = 150 + (Math.random() * 100);
  
  // FIXED: More data points and proper timeframe intervals
  let intervals = 30;
  let periodMs = 24 * 60 * 60 * 1000; // Default to 1 day
  
  switch (timeframe) {
    case '1H':
      intervals = 60; // 60 hourly candles
      periodMs = 60 * 60 * 1000; // 1 hour
      break;
    case '4H':
      intervals = 48; // 48 4-hour candles (8 days)
      periodMs = 4 * 60 * 60 * 1000; // 4 hours
      break;
    case '1D':
      intervals = 30; // 30 daily candles
      periodMs = 24 * 60 * 60 * 1000; // 1 day
      break;
    case '1W':
      intervals = 26; // 26 weekly candles (6 months)
      periodMs = 7 * 24 * 60 * 60 * 1000; // 1 week
      break;
    case '1M':
      intervals = 12; // 12 monthly candles (1 year)
      periodMs = 30 * 24 * 60 * 60 * 1000; // 1 month
      break;
    case '1Y':
      intervals = 5; // 5 yearly candles
      periodMs = 365 * 24 * 60 * 60 * 1000; // 1 year
      break;
    default:
      intervals = 30;
      periodMs = 24 * 60 * 60 * 1000;
  }
  
  console.log(`🕯️ Generating ${intervals} candles for ${timeframe}`);
  
  // Generate data going backwards from today
  const now = new Date();
  
  for (let i = 0; i < intervals; i++) {
    // Calculate timestamp going backwards
    const timestamp = new Date(now.getTime() - (intervals - 1 - i) * periodMs);
    
    // Generate realistic price movement
    const trend = Math.sin((i / intervals) * Math.PI * 2) * 0.02;
    const volatility = (Math.random() - 0.5) * 0.04;
    const movement = trend + volatility;
    
    const open = basePrice;
    const close = Math.max(1, open * (1 + movement));
    
    // Ensure proper OHLC relationships
    const range = Math.abs(close - open) * (1 + Math.random() * 0.5);
    const high = Math.max(open, close) + range * Math.random() * 0.3;
    const low = Math.min(open, close) - range * Math.random() * 0.3;
    
    data.push({
      x: timestamp.toISOString(), // FIXED: Proper ISO format
      y: [
        parseFloat(open.toFixed(2)),
        parseFloat(high.toFixed(2)),
        parseFloat(low.toFixed(2)),
        parseFloat(close.toFixed(2))
      ]
    });
    
    basePrice = close; // Continue trend
  }
  
  // FIXED: Sort by timestamp to ensure proper order
  data.sort((a, b) => new Date(a.x).getTime() - new Date(b.x).getTime());
  
  console.log(`✅ Generated ${data.length} candles from ${data[0]?.x} to ${data[data.length - 1]?.x}`);
  
  return data;
}



}

// FIXED TradingAPI - Using credentials pattern from your working dashboard
class TradingAPI {
  private baseUrl: string;

  constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
  }

  async executeOrder(orderData: any) {
    try {
      console.log('🔄 Executing order...');
      const response = await fetch(`${this.baseUrl}/api/trading/order`, {
        method: 'POST',
        credentials: 'include', // FIXED: Using same pattern as dashboard
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Order execution failed');
      }

      return data;
    } catch (error) {
      console.error('Trading API error:', error);
      throw error;
    }
  }

  async getAllTradingData(): Promise<TradingData> {
    try {
      console.log('🔄 Fetching all trading data...');
      
      // FIXED: Single consolidated fetch like your dashboard
      const [portfolioRes, walletRes] = await Promise.all([
        fetch(`${this.baseUrl}/api/trading/portfolio`, {
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
        }),
        fetch(`${this.baseUrl}/api/trading/wallet`, {
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
        })
      ]);

      const [portfolioData, walletData] = await Promise.all([
        portfolioRes.json(),
        walletRes.json()
      ]);

      return {
        portfolio: portfolioData.success ? portfolioData.portfolio : null,
        userBalance: walletData.success ? walletData.balance : 10000,
        stats: portfolioData.stats || null
      };
    } catch (error) {
      console.error('Trading data fetch error:', error);
      return {
        portfolio: null,
        userBalance: 10000
      };
    }
  }
}

// Stock Search Component
const StockSearch: React.FC<{ onStockSelect: (stock: SearchResult) => void }> = ({ onStockSelect }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [debouncedQuery] = useDebounce(query, 300);
  
  const stockAPI = useMemo(() => new StockAPI(), []);

  useEffect(() => {
    const searchStocks = async () => {
      if (debouncedQuery.length >= 2) {
        setLoading(true);
        try {
          const searchResults = await stockAPI.searchStocks(debouncedQuery);
          setResults(searchResults);
          setIsOpen(searchResults.length > 0);
        } catch (error) {
          console.error('Search failed:', error);
          setResults([]);
          setIsOpen(false);
        } finally {
          setLoading(false);
        }
      } else {
        setResults([]);
        setIsOpen(false);
        setLoading(false);
      }
    };

    searchStocks();
  }, [debouncedQuery, stockAPI]);

  const handleSelect = (stock: SearchResult) => {
    onStockSelect(stock);
    setQuery('');
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <div className="relative">
        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => results.length > 0 && setIsOpen(true)}
          onBlur={() => setTimeout(() => setIsOpen(false), 150)}
          placeholder="Search stocks, crypto, forex..."
          className="w-full pl-12 pr-12 py-3 bg-gray-800/50 border border-gray-700/50 rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all backdrop-blur-sm"
        />
        {loading && (
          <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
            <div className="animate-spin h-5 w-5 border-2 border-emerald-500 border-t-transparent rounded-full"></div>
          </div>
        )}
      </div>

      {isOpen && results.length > 0 && (
        <div className="absolute z-50 w-full mt-2 bg-gray-800/95 backdrop-blur-lg border border-gray-700/50 rounded-xl shadow-2xl max-h-80 overflow-y-auto">
          <div className="p-2 border-b border-gray-700/50">
            <p className="text-xs text-gray-400 font-medium">Search Results ({results.length})</p>
          </div>
          {results.map((stock, index) => (
            <div
              key={`${stock.symbol}-${index}`}
              onMouseDown={() => handleSelect(stock)}
              className="flex items-center justify-between p-4 hover:bg-gray-700/30 cursor-pointer border-b border-gray-700/30 last:border-b-0 transition-all group"
            >
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-blue-500 rounded-lg flex items-center justify-center">
                  <TrendingUp className="h-4 w-4 text-white" />
                </div>
                <div>
                  <div className="font-bold text-sm text-white">{stock.symbol}</div>
                  <div className="text-xs text-gray-400 truncate max-w-48">{stock.name}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity">
                  {stock.exchange}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Market Stats Component
const MarketStats: React.FC = () => {
  const [marketData, setMarketData] = useState([
    { label: 'S&P 500', value: '4,234.56', change: '+1.24%', positive: true },
    { label: 'NASDAQ', value: '13,456.78', change: '+2.18%', positive: true },
    { label: 'DOW', value: '34,567.89', change: '-0.45%', positive: false },
    { label: 'BTC', value: '$45,678', change: '+3.42%', positive: true },
  ]);

  return (
    <div className="bg-gray-800/30 backdrop-blur-sm border border-gray-700/30 rounded-xl p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-white flex items-center">
          <Activity className="h-5 w-5 text-emerald-500 mr-2" />
          Market Overview
        </h3>
        <div className="flex items-center text-emerald-500">
          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse mr-2"></div>
          <span className="text-xs font-medium">LIVE</span>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        {marketData.map((item, index) => (
          <div key={index} className="bg-gray-900/50 rounded-lg p-3 border border-gray-700/30 hover:bg-gray-800/50 transition-colors">
            <div className="text-xs text-gray-400 mb-1">{item.label}</div>
            <div className="text-sm font-bold text-white mb-1">{item.value}</div>
            <div className={`text-xs font-medium flex items-center transition-colors ${
              item.positive ? 'text-emerald-400' : 'text-red-400'
            }`}>
              {item.positive ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
              {item.change}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Stock List Component
const StockList: React.FC<{ 
  stocks: Stock[], 
  selectedStock: string, 
  onStockSelect: (symbol: string) => void,
  loading: boolean 
}> = ({ stocks, selectedStock, onStockSelect, loading }) => {
  const [filter, setFilter] = useState<'all' | 'gainers' | 'losers'>('all');

  const filteredStocks = useMemo(() => {
    return stocks.filter(stock => {
      if (filter === 'gainers') return stock.changePercent > 0;
      if (filter === 'losers') return stock.changePercent < 0;
      return true;
    });
  }, [stocks, filter]);

  if (loading) {
    return (
      <div className="bg-gray-800/30 backdrop-blur-sm border border-gray-700/30 rounded-xl">
        <div className="p-4 border-b border-gray-700/30">
          <div className="h-6 bg-gray-700/50 rounded animate-pulse"></div>
        </div>
        <div className="p-4 space-y-3">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="h-16 bg-gray-700/30 rounded-lg"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const formatVolume = (volume: number): string => {
    if (volume >= 1e9) return `${(volume / 1e9).toFixed(1)}B`;
    if (volume >= 1e6) return `${(volume / 1e6).toFixed(1)}M`;
    if (volume >= 1e3) return `${(volume / 1e3).toFixed(1)}K`;
    return volume.toString();
  };

  return (
    <div className="bg-gray-800/30 backdrop-blur-sm border border-gray-700/30 rounded-xl">
      <div className="p-4 border-b border-gray-700/30">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-white flex items-center">
            <Zap className="h-5 w-5 text-yellow-500 mr-2" />
            Top Stocks
          </h2>
          <div className="flex items-center text-emerald-500">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse mr-2"></div>
            <span className="text-xs font-medium">LIVE</span>
          </div>
        </div>
        
        <div className="flex space-x-2">
          {[
            { key: 'all', label: 'All', icon: Target },
            { key: 'gainers', label: 'Gainers', icon: TrendingUp },
            { key: 'losers', label: 'Losers', icon: TrendingDown }
          ].map((item) => (
            <button
              key={item.key}
              onClick={() => setFilter(item.key as any)}
              className={`flex items-center px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                filter === item.key
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'bg-gray-700/30 text-gray-400 hover:bg-gray-700/50 hover:text-gray-300'
              }`}
            >
              <item.icon className="h-3 w-3 mr-1" />
              {item.label} ({filter === item.key ? filteredStocks.length : 
                item.key === 'gainers' ? stocks.filter(s => s.changePercent > 0).length :
                item.key === 'losers' ? stocks.filter(s => s.changePercent < 0).length :
                stocks.length})
            </button>
          ))}
        </div>
      </div>
      
      <div className="p-4 max-h-96 overflow-y-auto">
        <div className="space-y-2">
          {filteredStocks.length > 0 ? filteredStocks.map((stock) => (
            <div
              key={stock.symbol}
              onClick={() => onStockSelect(stock.symbol)}
              className={`group p-4 rounded-xl cursor-pointer transition-all border ${
                selectedStock === stock.symbol
                  ? 'border-emerald-500/50 bg-emerald-500/10 shadow-lg shadow-emerald-500/10'
                  : 'border-gray-700/30 bg-gray-900/30 hover:border-gray-600/50 hover:bg-gray-800/50'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    stock.changePercent >= 0 
                      ? 'bg-gradient-to-br from-emerald-500/20 to-green-500/20'
                      : 'bg-gradient-to-br from-red-500/20 to-pink-500/20'
                  }`}>
                    <span className="font-bold text-sm text-white">
                      {stock.symbol.substring(0, 2)}
                    </span>
                  </div>
                  <div>
                    <div className="font-bold text-sm text-white group-hover:text-emerald-400 transition-colors">
                      {stock.symbol}
                    </div>
                    <div className="text-xs text-gray-400 truncate max-w-24">
                      {stock.name}
                    </div>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="font-bold text-sm text-white mb-1">
                    ${stock.price.toFixed(2)}
                  </div>
                  <div className={`flex items-center justify-end text-xs font-medium ${
                    stock.changePercent >= 0 ? 'text-emerald-400' : 'text-red-400'
                  }`}>
                    {stock.changePercent >= 0 ? (
                      <ArrowUpRight className="h-3 w-3 mr-1" />
                    ) : (
                      <ArrowDownRight className="h-3 w-3 mr-1" />
                    )}
                    {Math.abs(stock.changePercent).toFixed(2)}%
                  </div>
                </div>
              </div>
              
              <div className="mt-3">
                <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                  <span>Volume</span>
                  <span>{formatVolume(stock.volume)}</span>
                </div>
                <div className="w-full bg-gray-700/30 rounded-full h-1">
                  <div 
                    className={`h-1 rounded-full transition-all ${
                      stock.changePercent >= 0 ? 'bg-emerald-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${Math.min(Math.abs(stock.changePercent * 10), 100)}%` }}
                  ></div>
                </div>
              </div>
            </div>
          )) : (
            <div className="text-center py-8 text-gray-500">
              <Filter className="h-8 w-8 mx-auto mb-2" />
              <p>No stocks match the selected filter</p>
              <button
                onClick={() => setFilter('all')}
                className="mt-2 text-emerald-500 hover:text-emerald-400 text-sm"
              >
                Show all stocks
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// FIXED Portfolio Display - Matches your backend schema exactly
const PortfolioDisplay: React.FC<{ 
  tradingData: TradingData,
  loading: boolean,
  showBalance: boolean,
  onToggleBalance: () => void 
}> = ({ tradingData, loading, showBalance, onToggleBalance }) => {

  // Calculate display positions from your backend's "stocks" array
  const displayPositions: DisplayPosition[] = useMemo(() => {
    if (!tradingData.portfolio || !tradingData.portfolio.stocks) return [];
    
    return tradingData.portfolio.stocks.map(stock => {
      const unrealizedPnL = (stock.currentPrice - stock.purchasePrice) * stock.quantity;
      const unrealizedPnLPercent = stock.purchasePrice > 0 ? ((stock.currentPrice - stock.purchasePrice) / stock.purchasePrice) * 100 : 0;
      const marketValue = stock.quantity * stock.currentPrice;
      
      return {
        ...stock,
        unrealizedPnL,
        unrealizedPnLPercent,
        marketValue
      };
    });
  }, [tradingData.portfolio]);

  if (loading) {
    return (
      <div className="bg-gray-800/30 backdrop-blur-sm border border-gray-700/30 rounded-xl p-4">
        <div className="h-6 bg-gray-700/50 rounded animate-pulse mb-4"></div>
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-20 bg-gray-700/30 rounded-lg animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  const portfolio = tradingData.portfolio;
  const totalValue = portfolio?.totalValue || tradingData.userBalance || 10000;
  const totalPnL = portfolio?.totalPnL || 0;
  const cashBalance = portfolio?.cashBalance || tradingData.userBalance || 10000;
  const stocksCount = portfolio?.stocks?.length || 0;

  const stockValue = displayPositions.reduce((total, pos) => total + pos.marketValue, 0);
  const portfolioChangePercent = totalValue > 0 && totalPnL !== 0 ? ((totalPnL / (totalValue - totalPnL)) * 100) : 0;

  return (
    <div className="bg-gray-800/30 backdrop-blur-sm border border-gray-700/30 rounded-xl p-4">
      <h3 className="text-lg font-bold text-white mb-4 flex items-center">
        <Wallet className="h-5 w-5 text-emerald-500 mr-2" />
        Portfolio Overview
        <span className={`ml-2 px-2 py-1 text-xs rounded ${
          portfolio && stocksCount > 0 ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'
        }`}>
          {portfolio && stocksCount > 0 ? 'Live' : 'Demo'}
        </span>
      </h3>
      
      {/* Total Value Display */}
      <div className="bg-gradient-to-r from-gray-700/30 to-gray-600/30 rounded-lg p-4 mb-4 border border-gray-600/20">
        <div className="flex items-center justify-between mb-2">
          <div className="text-sm text-gray-400">Total Portfolio Value</div>
          <button
            onClick={onToggleBalance}
            className="text-gray-400 hover:text-white transition-colors"
          >
            {showBalance ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
          </button>
        </div>
        <div className="text-3xl font-bold text-white">
          {showBalance ? `$${totalValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '****'}
        </div>
        <div className={`text-sm flex items-center mt-2 ${totalPnL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
          {totalPnL >= 0 ? (
            <ArrowUpRight className="h-4 w-4 mr-1" />
          ) : (
            <ArrowDownRight className="h-4 w-4 mr-1" />
          )}
          <span className="font-semibold">
            {showBalance ? `${totalPnL >= 0 ? '+' : ''}$${totalPnL.toFixed(2)} P&L` : '***'}
          </span>
          {Math.abs(portfolioChangePercent) > 0 && showBalance && (
            <span className="ml-2 text-xs opacity-80">
              ({portfolioChangePercent >= 0 ? '+' : ''}{portfolioChangePercent.toFixed(2)}%)
            </span>
          )}
        </div>
      </div>
      
      {/* Key Metrics */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-gray-900/50 rounded-lg p-3 border border-gray-700/30">
          <div className="text-xs text-gray-400 mb-1 flex items-center">
            <DollarSign className="h-3 w-3 mr-1" />
            Cash Balance
          </div>
          <div className="text-lg font-bold text-emerald-400">
            {showBalance ? `$${cashBalance.toLocaleString()}` : '****'}
          </div>
          <div className="text-xs text-gray-500 mt-1">Available</div>
        </div>
        
        <div className="bg-gray-900/50 rounded-lg p-3 border border-gray-700/30">
          <div className="text-xs text-gray-400 mb-1 flex items-center">
            <TrendingUp className="h-3 w-3 mr-1" />
            Stock Value
          </div>
          <div className="text-lg font-bold text-blue-400">
            {showBalance ? `$${stockValue.toLocaleString()}` : '****'}
          </div>
          <div className="text-xs text-gray-500 mt-1">Holdings</div>
        </div>
        
        <div className="bg-gray-900/50 rounded-lg p-3 border border-gray-700/30">
          <div className="text-xs text-gray-400 mb-1 flex items-center">
            <Target className="h-3 w-3 mr-1" />
            Positions
          </div>
          <div className="text-lg font-bold text-white">
            {stocksCount}
          </div>
          <div className="text-xs text-gray-500 mt-1">Stocks</div>
        </div>
        
        <div className="bg-gray-900/50 rounded-lg p-3 border border-gray-700/30">
          <div className="text-xs text-gray-400 mb-1 flex items-center">
            <Activity className="h-3 w-3 mr-1" />
            Total P&L
          </div>
          <div className={`text-lg font-bold ${totalPnL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {showBalance ? `${totalPnL >= 0 ? '+' : ''}$${totalPnL.toFixed(0)}` : '***'}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {totalPnL >= 0 ? 'Profit' : 'Loss'}
          </div>
        </div>
      </div>

      {/* Holdings Section */}
      <div>
        <div className="flex justify-between items-center mb-3">
          <div className="text-sm font-medium text-gray-300 flex items-center">
            <Wallet className="h-4 w-4 mr-1" />
            Holdings
          </div>
          {stocksCount > 0 && (
            <div className="text-xs text-gray-500 bg-gray-700/50 px-2 py-1 rounded">
              {stocksCount} position{stocksCount !== 1 ? 's' : ''}
            </div>
          )}
        </div>
        
        {displayPositions && displayPositions.length > 0 ? (
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {displayPositions.map((position: DisplayPosition, index: number) => (
              <div key={`${position.symbol}-${index}`} className="flex justify-between items-center text-sm bg-gray-900/50 rounded-lg p-3 hover:bg-gray-800/50 transition-colors">
                <div className="flex items-center space-x-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-xs font-bold ${
                    position.unrealizedPnL >= 0 ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                  }`}>
                    {position.symbol.substring(0, 2)}
                  </div>
                  <div>
                    <div className="text-white font-medium">{position.symbol}</div>
                    <div className="text-xs text-gray-400">
                      {position.quantity} × ${position.purchasePrice?.toFixed(2) || '0.00'}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-white font-semibold">
                    {showBalance ? `$${position.marketValue.toLocaleString()}` : '****'}
                  </div>
                  <div className={`text-xs flex items-center justify-end ${position.unrealizedPnL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {position.unrealizedPnL >= 0 ? (
                      <ArrowUpRight className="h-3 w-3 mr-1" />
                    ) : (
                      <ArrowDownRight className="h-3 w-3 mr-1" />
                    )}
                    {showBalance ? `${position.unrealizedPnL >= 0 ? '+' : ''}$${position.unrealizedPnL.toFixed(2)}` : '***'}
                    {Math.abs(position.unrealizedPnLPercent) > 0 && showBalance && (
                      <span className="ml-1">
                        ({position.unrealizedPnLPercent >= 0 ? '+' : ''}{position.unrealizedPnLPercent.toFixed(1)}%)
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {displayPositions.length > 5 && (
              <button className="text-xs text-emerald-400 hover:text-emerald-300 mt-2 transition-colors w-full text-center py-2 bg-gray-800/50 rounded-lg hover:bg-gray-700/50">
                View All {displayPositions.length} Positions →
              </button>
            )}
          </div>
        ) : (
          <div className="text-center py-6 bg-gray-900/30 rounded-lg border border-gray-700/50">
            <div className="w-12 h-12 bg-gray-700/50 rounded-full flex items-center justify-center mx-auto mb-3">
              <TrendingUp className="h-6 w-6 text-gray-500" />
            </div>
            <div className="text-gray-500 text-sm mb-1">No positions yet</div>
            <div className="text-gray-400 text-xs">Start trading to build your portfolio</div>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="mt-4 pt-4 border-t border-gray-700/30">
        <div className="grid grid-cols-2 gap-2">
          <button className="flex items-center justify-center px-3 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 text-xs rounded-lg transition-colors">
            <Plus className="h-3 w-3 mr-1" />
            Add Funds
          </button>
          <button className="flex items-center justify-center px-3 py-2 bg-gray-700/50 hover:bg-gray-700 text-gray-300 text-xs rounded-lg transition-colors">
            <Clock className="h-3 w-3 mr-1" />
            History
          </button>
        </div>
      </div>
    </div>
  );
};

// Trading Panel Component - Matches your tradingService.js exactly
const TradingPanel: React.FC<{
  selectedStock: string,
  selectedStockData: Stock | null | undefined,
  connected: boolean,
  tradingData: TradingData,
  onTradeExecuted: () => void,
  loading: boolean
}> = ({ selectedStock, selectedStockData, connected, tradingData, onTradeExecuted, loading }) => {
  const [orderType, setOrderType] = useState<'market' | 'limit' | 'stop'>('market');
  const [tradeType, setTradeType] = useState<'BUY' | 'SELL'>('BUY');
  const [quantity, setQuantity] = useState('');
  const [limitPrice, setLimitPrice] = useState('');
  const [stopPrice, setStopPrice] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const tradingAPI = useMemo(() => new TradingAPI(), []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedStock || !quantity) {
      setError('Please select a stock and enter quantity');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      // This matches your tradingService.js executeTrade method
      const orderData = {
        symbol: selectedStock,
        type: tradeType, // 'BUY' or 'SELL' as your backend expects
        quantity: parseInt(quantity),
        orderType,
        ...(orderType === 'limit' && { limitPrice: parseFloat(limitPrice) }),
        ...(orderType === 'stop' && { stopPrice: parseFloat(stopPrice) })
      };

      const result = await tradingAPI.executeOrder(orderData);
      
      if (result.success || result.trade) {
        setSuccess(`${tradeType} order executed successfully!`);
        setQuantity('');
        setLimitPrice('');
        setStopPrice('');
        onTradeExecuted();
      } else {
        setError(result.error || 'Order execution failed');
      }
    } catch (error: any) {
      setError(error.message || 'Order execution failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentPrice = selectedStockData?.price || 0;
  const totalValue = currentPrice * (parseInt(quantity) || 0);
  const availableBalance = tradingData.portfolio?.cashBalance || tradingData.userBalance;

  if (loading) {
    return (
      <div className="bg-gray-800/30 backdrop-blur-sm border border-gray-700/30 rounded-xl p-4">
        <div className="h-6 bg-gray-700/50 rounded animate-pulse mb-4"></div>
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-12 bg-gray-700/30 rounded-lg animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-800/30 backdrop-blur-sm border border-gray-700/30 rounded-xl p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-white flex items-center">
          <Target className="h-5 w-5 text-emerald-500 mr-2" />
          Trade
        </h3>
        <div className={`flex items-center space-x-2 ${connected ? 'text-green-400' : 'text-red-400'}`}>
          {connected ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
          <span className="text-xs">{connected ? 'Live' : 'Offline'}</span>
        </div>
      </div>

      {selectedStock ? (
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Stock Info */}
          <div className="bg-gray-700/30 rounded-lg p-3">
            <div className="flex justify-between items-center">
              <div>
                <div className="font-semibold text-white text-sm">{selectedStock}</div>
                <div className="text-xs text-gray-400 truncate max-w-20">
                  {selectedStockData?.name}
                </div>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold text-white">
                  ${selectedStockData?.price.toFixed(2) || '0.00'}
                </div>
                {selectedStockData && (
                  <div className={`text-xs flex items-center ${
                    selectedStockData.changePercent >= 0 ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {selectedStockData.changePercent >= 0 ? (
                      <ArrowUpRight className="h-3 w-3 mr-1" />
                    ) : (
                      <ArrowDownRight className="h-3 w-3 mr-1" />
                    )}
                    {Math.abs(selectedStockData.changePercent).toFixed(2)}%
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Trade Type */}
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setTradeType('BUY')}
              className={`py-2 px-3 text-sm rounded-lg font-semibold transition-all ${
                tradeType === 'BUY'
                  ? 'bg-green-500 text-white'
                  : 'bg-gray-700/50 text-gray-300 hover:bg-gray-700'
              }`}
            >
              Buy
            </button>
            <button
              type="button"
              onClick={() => setTradeType('SELL')}
              className={`py-2 px-3 text-sm rounded-lg font-semibold transition-all ${
                tradeType === 'SELL'
                  ? 'bg-red-500 text-white'
                  : 'bg-gray-700/50 text-gray-300 hover:bg-gray-700'
              }`}
            >
              Sell
            </button>
          </div>

          {/* Order Details */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-medium text-gray-300 mb-1">
                Order Type
              </label>
              <select
                value={orderType}
                onChange={(e) => setOrderType(e.target.value as 'market' | 'limit' | 'stop')}
                className="w-full px-2 py-1 text-xs bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="market">Market</option>
                <option value="limit">Limit</option>
                <option value="stop">Stop</option>
              </select>
            </div>
            
            <div>
              <label className="block text-xs font-medium text-gray-300 mb-1">
                Quantity
              </label>
              <input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="Qty"
                className="w-full px-2 py-1 text-xs bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                min="1"
                required
              />
            </div>
          </div>

          {/* Conditional Price Inputs */}
          {orderType === 'limit' && (
            <div>
              <label className="block text-xs font-medium text-gray-300 mb-1">
                Limit Price
              </label>
              <input
                type="number"
                value={limitPrice}
                onChange={(e) => setLimitPrice(e.target.value)}
                placeholder="Enter limit price"
                className="w-full px-2 py-1 text-xs bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                step="0.01"
                min="0"
                required
              />
            </div>
          )}

          {orderType === 'stop' && (
            <div>
              <label className="block text-xs font-medium text-gray-300 mb-1">
                Stop Price
              </label>
              <input
                type="number"
                value={stopPrice}
                onChange={(e) => setStopPrice(e.target.value)}
                placeholder="Enter stop price"
                className="w-full px-2 py-1 text-xs bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                step="0.01"
                min="0"
                required
              />
            </div>
          )}

          {/* Order Summary */}
          {quantity && currentPrice > 0 && (
            <div className="bg-gray-700/30 rounded-lg p-2">
              <div className="flex justify-between text-xs">
                <span className="text-gray-400">Total</span>
                <span className="text-white font-semibold">
                  ${totalValue.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between text-xs mt-1">
                <span className="text-gray-400">Available</span>
                <span className="text-white">${availableBalance.toFixed(2)}</span>
              </div>
            </div>
          )}

          {/* Error/Success Messages */}
          {error && (
            <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-2 flex items-center">
              <AlertCircle className="h-4 w-4 text-red-400 mr-2" />
              <span className="text-red-400 text-xs">{error}</span>
            </div>
          )}

          {success && (
            <div className="bg-green-500/20 border border-green-500/30 rounded-lg p-2 flex items-center">
              <Shield className="h-4 w-4 text-green-400 mr-2" />
              <span className="text-green-400 text-xs">{success}</span>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting || !connected || !selectedStock || !quantity}
            className={`w-full py-2 px-4 text-sm rounded-lg font-semibold transition-all ${
              isSubmitting || !connected || !selectedStock || !quantity
                ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                : tradeType === 'BUY'
                ? 'bg-green-500 hover:bg-green-600 text-white'
                : 'bg-red-500 hover:bg-red-600 text-white'
            }`}
          >
            {isSubmitting ? (
              <div className="flex items-center justify-center">
                <RefreshCw className="h-3 w-3 mr-2 animate-spin" />
                Processing...
              </div>
            ) : (
              `${tradeType === 'BUY' ? 'Buy' : 'Sell'} ${selectedStock || 'Stock'}`
            )}
          </button>
        </form>
      ) : (
        <div className="text-center py-6">
          <Target className="h-8 w-8 text-gray-500 mx-auto mb-2" />
          <p className="text-gray-400 text-sm mb-1">Select a Stock</p>
          <p className="text-gray-500 text-xs">Choose from the list to trade</p>
        </div>
      )}
    </div>
  );
};

// Loading Skeleton Component
function LoadingSkeleton() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-900 to-blue-900/20">
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-900/20 via-gray-900 to-gray-900"></div>
      <div className="relative z-10 p-4">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <div className="h-8 bg-gray-700/50 w-64 mb-2 animate-pulse rounded"></div>
            <div className="h-4 bg-gray-700/30 w-48 animate-pulse rounded"></div>
          </div>

          {/* Search */}
          <div className="mb-6">
            <div className="h-12 bg-gray-700/50 w-full max-w-2xl animate-pulse rounded-xl"></div>
          </div>

          {/* Grid Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Sidebar */}
            <div className="lg:col-span-3 space-y-6">
              <div className="h-40 bg-gray-700/50 animate-pulse rounded-xl"></div>
              <div className="h-96 bg-gray-700/50 animate-pulse rounded-xl"></div>
            </div>

            {/* Center - Chart */}
            <div className="lg:col-span-6">
              <div className="h-[500px] bg-gray-700/50 animate-pulse rounded-xl"></div>
            </div>

            {/* Right Sidebar */}
            <div className="lg:col-span-3 space-y-6">
              <div className="h-80 bg-gray-700/50 animate-pulse rounded-xl"></div>
              <div className="h-60 bg-gray-700/50 animate-pulse rounded-xl"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Error Component
function ErrorDisplay({ error, onRetry }: { error: string; onRetry: () => void }) {
  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="text-center bg-gray-800/50 backdrop-blur-sm border border-gray-700/30 rounded-2xl p-8 max-w-md w-full">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-white mb-4">Trading Platform Error</h2>
        <p className="text-gray-400 mb-6">{error}</p>
        <button 
          onClick={onRetry}
          className="w-full py-3 bg-gradient-to-r from-emerald-500 to-blue-500 text-white font-bold rounded-lg transition-all hover:scale-105"
        >
          Try Again
        </button>
      </div>
    </div>
  );
}

// MAIN TRADING PAGE COMPONENT - FINAL VERSION
export default function TradingPage() {
  const { user, loading: authLoading } = useAuth();
  const { connected, subscribeTo } = useSocket();
  const router = useRouter();
  
  const [selectedStock, setSelectedStock] = useState<string>('AAPL');
  const [topStocks, setTopStocks] = useState<Stock[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [showBalance, setShowBalance] = useState(true);
  
  // FIXED: Single state object for all trading data
  const [tradingData, setTradingData] = useState<TradingData>({
    portfolio: null,
    userBalance: 10000
  });
  
  const stockAPI = useMemo(() => new StockAPI(), []);
  const tradingAPI = useMemo(() => new TradingAPI(), []);

  // FIXED: Single comprehensive fetch function like your dashboard
  const fetchAllTradingData = useCallback(async (showRefresh = false) => {
    if (!user) return;
    
    if (showRefresh) setRefreshing(true);
    setError(null);
    
    try {
      console.log('🔄 Fetching all trading data...');
      
      // Parallel fetch - stocks and trading data
      const [stocksData, tradingDataResult] = await Promise.all([
        stockAPI.getTopStocks(),
        tradingAPI.getAllTradingData()
      ]);
      
      setTopStocks(stocksData);
      setTradingData(tradingDataResult);
      setLastUpdate(new Date());
      
      console.log('✅ All trading data loaded successfully');
      
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to fetch trading data';
      setError(errorMessage);
      console.error('❌ Trading data fetch error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user, stockAPI, tradingAPI]);

  // FIXED: Single useEffect for initial data loading
  useEffect(() => {
    if (!authLoading && user) {
      console.log('✅ User authenticated, loading trading data');
      fetchAllTradingData();
    } else if (!authLoading && !user) {
      console.log('❌ User not authenticated, redirecting');
      router.push('/');
    }
  }, [user, authLoading, router, fetchAllTradingData]);

  // Auto-refresh every 60 seconds
  useEffect(() => {
    if (user && !loading && !error) {
      const interval = setInterval(() => {
        fetchAllTradingData();
      }, 60000);
      return () => clearInterval(interval);
    }
  }, [user, loading, error, fetchAllTradingData]);

  // Socket subscription for selected stock
  useEffect(() => {
    if (selectedStock && connected && subscribeTo) {
      subscribeTo(selectedStock);
    }
  }, [selectedStock, connected, subscribeTo]);

  const handleStockSelect = (stock: SearchResult) => {
    setSelectedStock(stock.symbol);
    setSidebarOpen(false);
  };

  const handleTradeExecuted = () => {
    console.log('🔄 Trade executed, refreshing data...');
    fetchAllTradingData(true);
  };

  const selectedStockData = useMemo(() => 
    topStocks.find(stock => stock.symbol === selectedStock)
  , [topStocks, selectedStock]);

  // Loading state
  if (authLoading || loading) {
    return <LoadingSkeleton />;
  }

  // Error state
  if (error) {
    return <ErrorDisplay error={error} onRetry={() => fetchAllTradingData()} />;
  }

  // No user
  if (!user) {
    return <LoadingSkeleton />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-900 to-blue-900/20">
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-900/20 via-gray-900 to-gray-900"></div>
      <div className="fixed inset-0 opacity-20" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.02'%3E%3Ccircle cx='30' cy='30' r='1'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
      }}></div>

      <div className="relative z-10 p-4">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-blue-500 rounded-2xl flex items-center justify-center">
                    <TrendingUp className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold text-white">Trading Terminal</h1>
                    <p className="text-gray-400">Professional trading with real-time data</p>
                  </div>
                </div>
                
                <button 
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  className="lg:hidden p-2 bg-gray-800/50 hover:bg-gray-800 text-white rounded-lg transition-all"
                >
                  {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
                </button>
              </div>
              
              <div className="flex items-center space-x-4">
                <div className={`flex items-center space-x-2 px-4 py-2 rounded-full text-sm font-medium backdrop-blur-sm ${
                  connected 
                    ? 'bg-emerald-500/20 border border-emerald-500/30 text-emerald-400' 
                    : 'bg-red-500/20 border border-red-500/30 text-red-400'
                }`}>
                  <div className={`w-2 h-2 rounded-full ${connected ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`}></div>
                  <span>{connected ? 'LIVE MARKET' : 'OFFLINE'}</span>
                  <Clock className="h-3 w-3" />
                </div>

                <div className="text-xs text-gray-400">
                  Updated: {lastUpdate.toLocaleTimeString()}
                </div>

                <button
                  onClick={() => fetchAllTradingData(true)}
                  disabled={refreshing}
                  className="flex items-center space-x-2 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs transition-colors disabled:opacity-50 rounded"
                >
                  <RefreshCw className={`h-3 w-3 ${refreshing ? 'animate-spin' : ''}`} />
                  <span>Refresh</span>
                </button>

                <button className="relative p-2 bg-gray-800/50 hover:bg-gray-800 text-gray-400 hover:text-white rounded-lg transition-all backdrop-blur-sm">
                  <Bell size={20} />
                  <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                    3
                  </span>
                </button>
              </div>
            </div>
          </div>

          {/* Search */}
          <div className="mb-6">
            <div className="max-w-2xl">
              <StockSearch onStockSelect={handleStockSelect} />
            </div>
          </div>

          {/* Main Grid Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Sidebar - Market Overview + Top Stocks */}
            <div className={`lg:col-span-3 space-y-6 ${sidebarOpen ? 'block' : 'hidden lg:block'}`}>
              <MarketStats />
              <StockList 
                stocks={topStocks}
                selectedStock={selectedStock}
                onStockSelect={setSelectedStock}
                loading={false}
              />
            </div>

            {/* Center - Chart */}
            <div className="lg:col-span-6">
              <CandlestickChart 
                symbol={selectedStock} 
                stockAPI={stockAPI} 
              />
            </div>

            {/* Right Sidebar - Portfolio + Trading Panel */}
            <div className="lg:col-span-3 space-y-6">
              <PortfolioDisplay 
                tradingData={tradingData}
                loading={false}
                showBalance={showBalance}
                onToggleBalance={() => setShowBalance(!showBalance)}
              />
              <TradingPanel 
                selectedStock={selectedStock}
                selectedStockData={selectedStockData}
                connected={connected}
                tradingData={tradingData}
                onTradeExecuted={handleTradeExecuted}
                loading={false}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
