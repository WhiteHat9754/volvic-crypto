'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import MarketOverviewChart from '../../components/chart';

import {
  TrendingUp,
  DollarSign,
  BarChart3,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Eye,
  EyeOff,
  RefreshCw,
  AlertCircle,
  Target,
  Wallet,
  Clock
} from 'lucide-react';

interface StockData {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  volume: string;
  high?: number;
  low?: number;
}

interface DashboardData {
  overview: {
    totalBalance: number;
    todayPnL: number;
    todayPnLPercent: number;
    weeklyPnL: number;
    weeklyPnLPercent: number;
    totalProfit: number;
    totalTrades: number;
    winRate: number;
    investedAmount?: number;
    availableBalance?: number;
    history: number[];
  };
  watchlist: StockData[];
  trades: Array<{
    _id: string;
    symbol: string;
    type: string;
    quantity: number;
    price: number;
    status: string;
    pnl: number;
    createdAt: string;
  }>;
  market: Array<{
    time: string;
    value: number;
  }>;
}

// Loading Skeleton - Move to top to avoid hoisting issues
function LoadingSkeleton() {
  return (
    <div className="min-h-screen bg-slate-900 p-4 pt-2">
      <div className="mb-6">
        <div className="h-6 bg-slate-800 w-48 mb-1 animate-pulse"></div>
        <div className="h-4 bg-slate-800 w-36 animate-pulse"></div>
      </div>
      
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 lg:gap-4 mb-6">
        {[...Array(6)].map((_, i) => (
          <div key={i} className={`${i === 0 ? 'col-span-2' : ''} bg-slate-800 p-3 border border-slate-700 min-h-[120px]`}>
            <div className="h-8 bg-slate-700 w-8 mb-2 animate-pulse"></div>
            <div className="h-3 bg-slate-700 w-16 mb-1 animate-pulse"></div>
            <div className="h-6 bg-slate-700 w-20 animate-pulse"></div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [showBalance, setShowBalance] = useState(true);

  // FIXED: Single fetch function with proper error/loading handling
  const fetchDashboardData = async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true);
    setError(null);
    
    try {
  
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/dashboard?endpoint=all`, {
        method: 'GET',
        credentials: 'include', // Critical for authentication
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error:', response.status, errorText);
        throw new Error(`Failed to fetch data: ${response.status} - ${response.statusText}`);
      }
      
      const data = await response.json();
      
      setDashboardData(data);
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to fetch dashboard data';
      setError(errorMessage);
      console.error('Dashboard fetch error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // FIXED: Single useEffect for initial data loading
  useEffect(() => {
    if (!authLoading && user) {
     
      fetchDashboardData();
    } else if (!authLoading && !user) {
      console.log('❌ User not authenticated, redirecting');
      router.push('/');
    }
  }, [user, authLoading, router]);

  // Auto-refresh every 60 seconds - only when user is authenticated
  useEffect(() => {
    if (user && dashboardData) {
      const interval = setInterval(() => {
        fetchDashboardData();
      }, 60000);
      return () => {
        clearInterval(interval);
      };
    }
  }, [user, dashboardData]);

  // Loading state
  if (authLoading || loading) {
    return <LoadingSkeleton />;
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="text-center p-6 bg-slate-800 border border-slate-700 max-w-md w-full rounded-lg">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-3" />
          <h2 className="text-xl font-bold text-white mb-2">Dashboard Error</h2>
          <p className="text-gray-400 mb-4 text-sm">{error}</p>
          <button
            onClick={() => fetchDashboardData()}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium transition-colors rounded"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // No user or no data
  if (!user || !dashboardData) {
    return <LoadingSkeleton />;
  }

  const { overview, watchlist, trades, market } = dashboardData;

  return (
    <div className="min-h-screen bg-slate-900">
      <div className="p-4 pt-2">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
          <div className="mb-3 sm:mb-0">
            <h1 className="text-2xl font-bold text-white mb-1">Dashboard</h1>
            <p className="text-gray-400 text-sm">Welcome back, {user.email?.split('@')[0] || 'User'}</p>
          </div>
          <button
            onClick={() => fetchDashboardData(true)}
            disabled={refreshing}
            className="flex items-center space-x-2 px-3 py-2 bg-green-600 hover:bg-green-700 text-white text-sm transition-colors disabled:opacity-50 rounded"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 lg:gap-4 mb-4">
          {/* Balance Card */}
          <div className="col-span-2 bg-gradient-to-br from-slate-800 to-slate-800/80 p-3 border border-slate-700 min-h-[100px] rounded">
            <div className="flex items-center justify-between mb-2">
              <div className="p-1.5 bg-green-500/10 flex-shrink-0 rounded">
                <DollarSign className="h-3.5 w-3.5 text-green-400" />
              </div>
              <button
                onClick={() => setShowBalance(!showBalance)}
                className="text-gray-400 hover:text-white transition-colors flex-shrink-0"
              >
                {showBalance ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
              </button>
            </div>
            <h3 className="text-gray-400 text-[10px] font-medium mb-1 uppercase tracking-wide">Total Balance</h3>
            <p className="text-base lg:text-lg font-bold text-white mb-1 font-mono leading-none">
              {showBalance ? `$${overview.totalBalance?.toLocaleString() || '0'}` : '****'}
            </p>
            <div className="flex items-center text-green-400 text-[10px]">
              <ArrowUpRight className="h-2.5 w-2.5 mr-1 flex-shrink-0" />
              <span className="truncate">+${overview.totalProfit?.toFixed(2).toLocaleString() || '0'} ({overview.todayPnLPercent || 0}%)</span>
            </div>
          </div>

          {/* Invested Card - FIXED: Show real data */}
          <div className="bg-slate-800 p-3 border border-slate-700 min-h-[100px] flex flex-col justify-between rounded">
            <div className="flex items-center justify-between">
              <div className="p-1.5 bg-blue-500/10 w-fit rounded">
                <Wallet className="h-3.5 w-3.5 text-blue-400" />
              </div>
            </div>
            <div>
              <h3 className="text-gray-400 text-[10px] font-medium mb-1 uppercase tracking-wide">Invested</h3>
              <p className="text-sm font-bold text-white font-mono leading-none">
                ${overview.investedAmount?.toFixed(2).toLocaleString() || '0'}
              </p>
            </div>
          </div>

          {/* Available Balance Card - FIXED: Show real data */}
          <div className="bg-slate-800 p-3 border border-slate-700 min-h-[100px] flex flex-col justify-between rounded">
            <div className="flex items-center justify-between">
              <div className="p-1.5 bg-yellow-500/10 w-fit rounded">
                <DollarSign className="h-3.5 w-3.5 text-yellow-400" />
              </div>
            </div>
            <div>
              <h3 className="text-gray-400 text-[10px] font-medium mb-1 uppercase tracking-wide">Available</h3>
              <p className="text-sm font-bold text-white font-mono leading-none">
                ${overview.availableBalance?.toFixed(2).toLocaleString() || overview.totalBalance?.toFixed(2).toLocaleString() || '0'}
              </p>
            </div>
          </div>

          {/* Total Bonus Card */}
          <div className="bg-slate-800 p-3 border border-slate-700 min-h-[100px] flex flex-col justify-between rounded">
            <div className="flex items-center justify-between">
              <div className="p-1.5 bg-purple-500/10 w-fit rounded">
                <Target className="h-3.5 w-3.5 text-purple-400" />
              </div>
            </div>
            <div>
              <h3 className="text-gray-400 text-[10px] font-medium mb-1 uppercase tracking-wide">Total Bonus</h3>
              <p className="text-sm font-bold text-green-400 font-mono leading-none">$500</p>
            </div>
          </div>

          {/* Trades Card */}
          <div className="bg-slate-800 p-3 border border-slate-700 min-h-[100px] flex flex-col justify-between rounded">
            <div className="flex items-center justify-between">
              <div className="p-1.5 bg-pink-500/10 w-fit rounded">
                <Activity className="h-3.5 w-3.5 text-pink-400" />
              </div>
            </div>
            <div>
              <h3 className="text-gray-400 text-[10px] font-medium mb-1 uppercase tracking-wide">Trades</h3>
              <p className="text-sm font-bold text-white font-mono leading-none">{overview.totalTrades || 0}</p>
            </div>
          </div>
        </div>

        {/* Watchlist Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Live Stock Data */}
          <div className="bg-slate-800 p-4 border border-slate-700 rounded">
            <h3 className="text-base font-semibold text-white mb-4">Live Stock Prices</h3>
            <div className="space-y-2">
              {watchlist && watchlist.length > 0 ? (
                watchlist.map((stock, index) => (
                  <div key={`${stock.symbol}-${index}`} className="flex items-center justify-between p-2.5 bg-slate-700/50 hover:bg-slate-700 transition-colors rounded">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="font-semibold text-white text-sm">{stock.symbol}</span>
                        <span className="text-[10px] text-gray-400 bg-slate-600 px-1.5 py-0.5 rounded">
                          {stock.volume}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 truncate">{stock.name}</p>
                    </div>
                    
                    <div className="text-right">
                      <p className="font-semibold text-white text-sm font-mono">${stock.price}</p>
                      <div className={`flex items-center justify-end text-xs font-medium ${
                        stock.change >= 0 ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {stock.change >= 0 ? (
                          <ArrowUpRight className="h-3 w-3 mr-1" />
                        ) : (
                          <ArrowDownRight className="h-3 w-3 mr-1" />
                        )}
                        <span>{stock.changePercent > 0 ? '+' : ''}{stock.changePercent}%</span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-6 text-gray-400">
                  <Activity className="h-10 w-10 mx-auto mb-3 opacity-50" />
                  <p className="text-sm">Loading stock data...</p>
                </div>
              )}
            </div>
          </div>

          {/* Market Chart */}
          <div className="bg-slate-800 p-4 border border-slate-700 rounded">
            {dashboardData?.market && (
              <div className="chart-container">
                <h3 className="text-base font-semibold text-white mb-4">Market Overview</h3>
                <MarketOverviewChart marketData={dashboardData.market} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
