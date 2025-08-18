// src/app/portfolio/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  Eye,
  EyeOff,
  RefreshCw,
  BarChart3,
  PieChart,
  Activity,
  Clock,
  Wallet,
  Bitcoin,
  Building2
} from 'lucide-react';

interface StockPosition {
  symbol: string;
  quantity: number;
  purchasePrice: number;
  currentPrice: number;
  marketValue: number;
  unrealizedPnL: number;
  unrealizedPnLPercent: number;
  lastUpdated: string;
}

interface CryptoBalance {
  currency: string;
  balance: number;
  usdValue: number;
  change24h: number;
}

interface PortfolioData {
  stocks: {
    positions: StockPosition[];
    totalValue: number;
    totalPnL: number;
    cashBalance: number;
  };
  crypto: {
    balances: CryptoBalance[];
    totalUSDValue: number;
  };
  combined: {
    totalValue: number;
    totalPnL: number;
    todayPnL: number;
  };
}

export default function PortfolioPage() {
  const { user } = useAuth();
  const [portfolioData, setPortfolioData] = useState<PortfolioData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showBalances, setShowBalances] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'stocks' | 'crypto' | 'analytics'>('overview');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPortfolioData();
  }, []);

  const fetchPortfolioData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch both stock and crypto data simultaneously
      const [stockResponse, cryptoResponse] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/trading/portfolio`, {
          credentials: "include"
        }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/crypto/account`, {
          credentials: "include"
        })
      ]);

      const stockData = await stockResponse.json();
      const cryptoData = await cryptoResponse.json();

      if (stockData.success && cryptoData) {
        // Process stock positions
        const stockPositions = stockData.portfolio.stocks.map((stock: any) => ({
          symbol: stock.symbol,
          quantity: stock.quantity,
          purchasePrice: stock.purchasePrice,
          currentPrice: stock.currentPrice,
          marketValue: stock.quantity * stock.currentPrice,
          unrealizedPnL: (stock.currentPrice - stock.purchasePrice) * stock.quantity,
          unrealizedPnLPercent: ((stock.currentPrice - stock.purchasePrice) / stock.purchasePrice) * 100,
          lastUpdated: stock.lastUpdated
        }));

        // Process crypto balances
        const cryptoBalances = Object.entries(cryptoData.account.balances).map(([currency, balance]) => ({
          currency,
          balance: balance as number,
          usdValue: (balance as number) * getCryptoPrice(currency),
          change24h: getCryptoChange24h(currency)
        })).filter(crypto => crypto.balance > 0);

        const stockTotalValue = stockPositions.reduce((sum: number, pos: StockPosition) => sum + pos.marketValue, 0);
        const stockTotalPnL = stockPositions.reduce((sum: number, pos: StockPosition) => sum + pos.unrealizedPnL, 0);
        const cryptoTotalValue = cryptoBalances.reduce((sum, crypto) => sum + crypto.usdValue, 0);

        setPortfolioData({
          stocks: {
            positions: stockPositions,
            totalValue: stockTotalValue,
            totalPnL: stockTotalPnL + stockData.portfolio.totalPnL,
            cashBalance: stockData.portfolio.cashBalance
          },
          crypto: {
            balances: cryptoBalances,
            totalUSDValue: cryptoTotalValue
          },
          combined: {
            totalValue: stockTotalValue + stockData.portfolio.cashBalance + cryptoTotalValue,
            totalPnL: stockTotalPnL + stockData.portfolio.totalPnL,
            todayPnL: stockData.portfolio.totalPnL
          }
        });
      }
    } catch (error) {
      console.error('Error fetching portfolio data:', error);
      setError('Failed to load portfolio data');
    } finally {
      setLoading(false);
    }
  };

  // Helper functions for crypto prices (replace with real API calls)
  const getCryptoPrice = (currency: string): number => {
    const prices: {[key: string]: number} = {
      BTC: 45000,
      ETH: 3200,
      LTC: 150,
      TRX: 0.08,
      USDT: 1
    };
    return prices[currency] || 0;
  };

  const getCryptoChange24h = (currency: string): number => {
    const changes: {[key: string]: number} = {
      BTC: 2.5,
      ETH: -1.2,
      LTC: 0.8,
      TRX: 3.2,
      USDT: 0.0
    };
    return changes[currency] || 0;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-slate-700 rounded w-64"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-slate-700 rounded-lg"></div>
            ))}
          </div>
          <div className="h-96 bg-slate-700 rounded-lg"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Wallet className="text-green-500" />
            Portfolio Overview
          </h1>
          <p className="text-slate-400 mt-2">Your complete investment dashboard</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowBalances(!showBalances)}
            className="flex items-center gap-2 px-4 py-2 bg-slate-700 rounded-lg hover:bg-slate-600 transition-colors"
          >
            {showBalances ? <EyeOff size={16} /> : <Eye size={16} />}
            {showBalances ? 'Hide' : 'Show'} Balances
          </button>
          <button
            onClick={fetchPortfolioData}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 rounded-lg hover:bg-green-700 transition-colors"
          >
            <RefreshCw size={16} />
            Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-900/20 border border-red-500 rounded-lg text-red-400">
          {error}
        </div>
      )}

      {/* Portfolio Summary Cards */}
      {portfolioData && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-slate-800 p-6 rounded-lg border border-slate-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">Total Portfolio Value</p>
                  <p className="text-2xl font-bold text-green-400">
                    {showBalances ? `$${portfolioData.combined.totalValue.toLocaleString()}` : '****'}
                  </p>
                </div>
                <DollarSign className="text-green-400" size={24} />
              </div>
            </div>

            <div className="bg-slate-800 p-6 rounded-lg border border-slate-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">Total P&L</p>
                  <p className={`text-2xl font-bold ${portfolioData.combined.totalPnL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {showBalances ? `${portfolioData.combined.totalPnL >= 0 ? '+' : ''}$${portfolioData.combined.totalPnL.toLocaleString()}` : '****'}
                  </p>
                </div>
                {portfolioData.combined.totalPnL >= 0 ? (
                  <TrendingUp className="text-green-400" size={24} />
                ) : (
                  <TrendingDown className="text-red-400" size={24} />
                )}
              </div>
            </div>

            <div className="bg-slate-800 p-6 rounded-lg border border-slate-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">Stock Portfolio</p>
                  <p className="text-xl font-bold">
                    {showBalances ? `$${(portfolioData.stocks.totalValue + portfolioData.stocks.cashBalance).toLocaleString()}` : '****'}
                  </p>
                  <p className="text-sm text-slate-400">{portfolioData.stocks.positions.length} positions</p>
                </div>
                <Building2 className="text-blue-400" size={24} />
              </div>
            </div>

            <div className="bg-slate-800 p-6 rounded-lg border border-slate-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">Crypto Portfolio</p>
                  <p className="text-xl font-bold">
                    {showBalances ? `$${portfolioData.crypto.totalUSDValue.toLocaleString()}` : '****'}
                  </p>
                  <p className="text-sm text-slate-400">{portfolioData.crypto.balances.length} currencies</p>
                </div>
                <Bitcoin className="text-orange-400" size={24} />
              </div>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex space-x-1 mb-6 bg-slate-800 p-1 rounded-lg border border-slate-700">
            {[
              { key: 'overview', label: 'Overview', icon: BarChart3 },
              { key: 'stocks', label: 'Stock Positions', icon: Building2 },
              { key: 'crypto', label: 'Crypto Holdings', icon: Bitcoin },
              { key: 'analytics', label: 'Analytics', icon: Activity }
            ].map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key as typeof activeTab)}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-md transition-colors ${
                  activeTab === key
                    ? 'bg-green-600 text-white'
                    : 'text-slate-400 hover:text-white hover:bg-slate-700'
                }`}
              >
                <Icon size={16} />
                {label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Asset Allocation */}
              <div className="bg-slate-800 p-6 rounded-lg border border-slate-700">
                <h3 className="text-xl font-bold mb-4">Asset Allocation</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-slate-700 rounded">
                    <div className="flex items-center gap-3">
                      <div className="w-4 h-4 bg-blue-500 rounded"></div>
                      <span>Stock Portfolio</span>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">
                        {showBalances ? `$${(portfolioData.stocks.totalValue + portfolioData.stocks.cashBalance).toLocaleString()}` : '****'}
                      </p>
                      <p className="text-sm text-slate-400">
                        {((portfolioData.stocks.totalValue + portfolioData.stocks.cashBalance) / portfolioData.combined.totalValue * 100).toFixed(1)}%
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-slate-700 rounded">
                    <div className="flex items-center gap-3">
                      <div className="w-4 h-4 bg-orange-500 rounded"></div>
                      <span>Crypto Portfolio</span>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">
                        {showBalances ? `$${portfolioData.crypto.totalUSDValue.toLocaleString()}` : '****'}
                      </p>
                      <p className="text-sm text-slate-400">
                        {(portfolioData.crypto.totalUSDValue / portfolioData.combined.totalValue * 100).toFixed(1)}%
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recent Performance */}
              <div className="bg-slate-800 p-6 rounded-lg border border-slate-700">
                <h3 className="text-xl font-bold mb-4">Performance Summary</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Today's P&L</span>
                    <span className={`font-bold ${portfolioData.combined.todayPnL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {showBalances ? `${portfolioData.combined.todayPnL >= 0 ? '+' : ''}$${portfolioData.combined.todayPnL.toFixed(2)}` : '****'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Total P&L</span>
                    <span className={`font-bold ${portfolioData.combined.totalPnL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {showBalances ? `${portfolioData.combined.totalPnL >= 0 ? '+' : ''}$${portfolioData.combined.totalPnL.toFixed(2)}` : '****'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Cash Balance</span>
                    <span className="font-bold text-blue-400">
                      {showBalances ? `$${portfolioData.stocks.cashBalance.toLocaleString()}` : '****'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'stocks' && (
            <div className="bg-slate-800 rounded-lg border border-slate-700">
              <div className="p-6 border-b border-slate-700">
                <h3 className="text-xl font-bold">Stock Positions</h3>
                <p className="text-slate-400 mt-1">{portfolioData.stocks.positions.length} active positions</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-700">
                      <th className="text-left p-4 font-medium text-slate-400">Symbol</th>
                      <th className="text-right p-4 font-medium text-slate-400">Quantity</th>
                      <th className="text-right p-4 font-medium text-slate-400">Avg Price</th>
                      <th className="text-right p-4 font-medium text-slate-400">Current Price</th>
                      <th className="text-right p-4 font-medium text-slate-400">Market Value</th>
                      <th className="text-right p-4 font-medium text-slate-400">P&L</th>
                      <th className="text-right p-4 font-medium text-slate-400">P&L %</th>
                    </tr>
                  </thead>
                  <tbody>
                    {portfolioData.stocks.positions.map((position, index) => (
                      <tr key={index} className="border-b border-slate-700/50 hover:bg-slate-700/30">
                        <td className="p-4 font-medium">{position.symbol}</td>
                        <td className="p-4 text-right">{position.quantity}</td>
                        <td className="p-4 text-right">${position.purchasePrice.toFixed(2)}</td>
                        <td className="p-4 text-right">${position.currentPrice.toFixed(2)}</td>
                        <td className="p-4 text-right font-medium">
                          {showBalances ? `$${position.marketValue.toLocaleString()}` : '****'}
                        </td>
                        <td className={`p-4 text-right font-medium ${position.unrealizedPnL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {showBalances ? `${position.unrealizedPnL >= 0 ? '+' : ''}$${position.unrealizedPnL.toFixed(2)}` : '****'}
                        </td>
                        <td className={`p-4 text-right font-medium ${position.unrealizedPnLPercent >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {position.unrealizedPnLPercent >= 0 ? '+' : ''}{position.unrealizedPnLPercent.toFixed(2)}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {portfolioData.stocks.positions.length === 0 && (
                  <div className="p-8 text-center text-slate-400">
                    <Building2 size={48} className="mx-auto mb-4 opacity-50" />
                    <p>No stock positions found</p>
                    <p className="text-sm mt-1">Start trading to see your positions here</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'crypto' && (
            <div className="bg-slate-800 rounded-lg border border-slate-700">
              <div className="p-6 border-b border-slate-700">
                <h3 className="text-xl font-bold">Crypto Holdings</h3>
                <p className="text-slate-400 mt-1">{portfolioData.crypto.balances.length} currencies</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-6">
                {portfolioData.crypto.balances.map((crypto, index) => (
                  <div key={index} className="bg-slate-700 p-4 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center text-sm font-bold">
                          {crypto.currency.charAt(0)}
                        </div>
                        <span className="font-medium">{crypto.currency}</span>
                      </div>
                      <div className={`flex items-center gap-1 text-sm ${crypto.change24h >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {crypto.change24h >= 0 ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                        {Math.abs(crypto.change24h)}%
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-400">Balance:</span>
                        <span>{showBalances ? `${crypto.balance.toFixed(6)} ${crypto.currency}` : '****'}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-400">USD Value:</span>
                        <span className="font-medium">
                          {showBalances ? `$${crypto.usdValue.toLocaleString()}` : '****'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
                {portfolioData.crypto.balances.length === 0 && (
                  <div className="col-span-full p-8 text-center text-slate-400">
                    <Bitcoin size={48} className="mx-auto mb-4 opacity-50" />
                    <p>No crypto holdings found</p>
                    <p className="text-sm mt-1">Deposit crypto to see your holdings here</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'analytics' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-slate-800 p-6 rounded-lg border border-slate-700">
                <h3 className="text-xl font-bold mb-4">Portfolio Breakdown</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Total Invested (Stocks):</span>
                    <span>{showBalances ? `$${portfolioData.stocks.positions.reduce((sum, pos) => sum + (pos.quantity * pos.purchasePrice), 0).toLocaleString()}` : '****'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Cash Available:</span>
                    <span>{showBalances ? `$${portfolioData.stocks.cashBalance.toLocaleString()}` : '****'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Crypto Holdings:</span>
                    <span>{showBalances ? `$${portfolioData.crypto.totalUSDValue.toLocaleString()}` : '****'}</span>
                  </div>
                  <div className="border-t border-slate-600 pt-3">
                    <div className="flex justify-between font-bold">
                      <span>Total Portfolio Value:</span>
                      <span className="text-green-400">
                        {showBalances ? `$${portfolioData.combined.totalValue.toLocaleString()}` : '****'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-slate-800 p-6 rounded-lg border border-slate-700">
                <h3 className="text-xl font-bold mb-4">Performance Metrics</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Total Return:</span>
                    <span className={portfolioData.combined.totalPnL >= 0 ? 'text-green-400' : 'text-red-400'}>
                      {showBalances ? `${portfolioData.combined.totalPnL >= 0 ? '+' : ''}$${portfolioData.combined.totalPnL.toFixed(2)}` : '****'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Stock Positions:</span>
                    <span>{portfolioData.stocks.positions.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Crypto Holdings:</span>
                    <span>{portfolioData.crypto.balances.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Diversification:</span>
                    <span>{portfolioData.stocks.positions.length + portfolioData.crypto.balances.length} assets</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
