// src/app/wallet/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import {
  Wallet,
  Plus,
  Minus,
  Eye,
  EyeOff,
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Bitcoin,
  DollarSign,
  TrendingUp,
  Activity,
  History,
  Building2,
  PieChart
} from 'lucide-react';
import UnifiedDepositModal from '@/components/DepositModal';
import UnifiedWithdrawModal from '@/components/WithdrawModal';

interface CryptoBalance {
  currency: string;
  balance: number;
  usdValue: number;
  change24h: number;
}

interface StockPosition {
  symbol: string;
  quantity: number;
  purchasePrice: number;
  currentPrice: number;
  marketValue: number;
  unrealizedPnL: number;
  unrealizedPnLPercent: number;
}

interface Transaction {
  _id: string;
  type: 'deposit' | 'withdraw';
  currency: string;
  amount: number;
  status: 'pending' | 'completed' | 'failed';
  createdAt: string;
  txHash?: string;
  fee?: number;
}

interface CombinedPortfolioData {
  crypto: {
    account: {
      balances: {
        BTC: number;
        ETH: number;
        LTC: number;
        TRX: number;
        USDT: number;
      };
      totalUSDValue: number;
      depositAddresses: {
        BTC: string;
        ETH: string;
      };
    };
    transactions: Transaction[];
  };
  stocks: {
    portfolio: {
      cashBalance: number;
      totalValue: number;
      totalPnL: number;
      stocks: StockPosition[];
    };
  };
  combined: {
    totalValue: number;
    stockValue: number;
    cryptoValue: number;
    cashBalance: number;
    totalPnL: number;
  };
}

export default function WalletPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [portfolioData, setPortfolioData] = useState<CombinedPortfolioData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showBalances, setShowBalances] = useState(true);
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    fetchCombinedPortfolioData();
  }, [user, router]);

  const fetchCombinedPortfolioData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch both crypto and stock data simultaneously
      const [cryptoResponse, stockResponse] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/crypto/account`, {
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' }
        }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/trading/portfolio`, {
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' }
        })
      ]);

      const cryptoData = await cryptoResponse.json();
      const stockData = await stockResponse.json();
      
      if (cryptoData.success && stockData.success) {
        // Calculate combined portfolio metrics
        const stockValue = stockData.portfolio.stocks.reduce((sum: number, stock: any) => 
          sum + (stock.quantity * stock.currentPrice), 0
        );
        
        const combinedData: CombinedPortfolioData = {
          crypto: cryptoData,
          stocks: stockData,
          combined: {
            totalValue: stockData.portfolio.totalValue + cryptoData.account.totalUSDValue,
            stockValue: stockValue + stockData.portfolio.cashBalance,
            cryptoValue: cryptoData.account.totalUSDValue,
            cashBalance: stockData.portfolio.cashBalance,
            totalPnL: stockData.portfolio.totalPnL
          }
        };
        
        setPortfolioData(combinedData);
      } else {
        setError('Failed to load portfolio data');
      }
    } catch (error) {
      console.error('Error fetching portfolio data:', error);
      setError('Failed to connect to services');
    } finally {
      setLoading(false);
    }
  };

  const handleTransactionSuccess = () => {
    fetchCombinedPortfolioData();
    setShowDepositModal(false);
    setShowWithdrawModal(false);
  };

  // Mock crypto prices (replace with real API)
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

  const getCryptoChange = (currency: string): number => {
    const changes: {[key: string]: number} = {
      BTC: 2.5,
      ETH: -1.2,
      LTC: 0.8,
      TRX: 3.2,
      USDT: 0.0
    };
    return changes[currency] || 0;
  };

  const getCryptoIcon = (currency: string) => {
    switch (currency) {
      case 'BTC':
        return <Bitcoin className="w-6 h-6 text-orange-500" />;
      case 'ETH':
        return <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-xs font-bold text-white">E</div>;
      case 'LTC':
        return <div className="w-6 h-6 rounded-full bg-gray-400 flex items-center justify-center text-xs font-bold text-white">L</div>;
      case 'TRX':
        return <div className="w-6 h-6 rounded-full bg-red-500 flex items-center justify-center text-xs font-bold text-white">T</div>;
      case 'USDT':
        return <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center text-xs font-bold text-white">U</div>;
      default:
        return <DollarSign className="w-6 h-6 text-gray-400" />;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-400" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-400" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-400" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-400" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-slate-700 rounded w-64"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-48 bg-slate-700 rounded-lg"></div>
            ))}
          </div>
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
            Portfolio Wallet
          </h1>
          <p className="text-slate-400 mt-2">Manage your complete investment portfolio</p>
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
            onClick={fetchCombinedPortfolioData}
            className="flex items-center gap-2 px-4 py-2 bg-slate-600 rounded-lg hover:bg-slate-700 transition-colors"
          >
            <RefreshCw size={16} />
            Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-900/20 border border-red-500 rounded-lg text-red-400 flex items-center gap-2">
          <AlertCircle size={20} />
          {error}
        </div>
      )}

      {portfolioData && (
        <>
          {/* Total Portfolio Balance Card */}
          <div className="bg-gradient-to-r from-green-600 to-blue-600 p-6 rounded-lg mb-8">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm">Total Portfolio Value</p>
                <p className="text-4xl font-bold text-white">
                  {showBalances ? `$${portfolioData.combined.totalValue.toLocaleString()}` : '****'}
                </p>
                <div className="flex items-center gap-4 mt-3">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="text-green-300" size={16} />
                    <span className="text-green-300 text-sm">
                      Total P&L: {showBalances ? `$${portfolioData.combined.totalPnL.toLocaleString()}` : '****'}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex flex-col gap-3">
                {/* Single Deposit Button */}
                <button
                  onClick={() => setShowDepositModal(true)}
                  className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                >
                  <Plus size={20} />
                  Deposit Funds
                </button>
                {/* Single Withdraw Button */}
                <button
                  onClick={() => setShowWithdrawModal(true)}
                  className="flex items-center gap-2 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
                >
                  <Minus size={20} />
                  Withdraw Funds
                </button>
              </div>
            </div>
          </div>

          {/* Portfolio Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {/* Stock Portfolio */}
            <div className="bg-slate-800 p-6 rounded-lg border border-slate-700">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <Building2 className="text-blue-400" size={24} />
                  <div>
                    <h3 className="font-bold">Stock Portfolio</h3>
                    <p className="text-slate-400 text-sm">{portfolioData.stocks.portfolio.stocks.length} positions</p>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <div>
                  <p className="text-slate-400 text-sm">Total Value</p>
                  <p className="font-bold text-xl text-blue-400">
                    {showBalances ? `$${portfolioData.combined.stockValue.toLocaleString()}` : '****'}
                  </p>
                </div>
                <div>
                  <p className="text-slate-400 text-sm">Cash Balance</p>
                  <p className="font-medium">
                    {showBalances ? `$${portfolioData.combined.cashBalance.toLocaleString()}` : '****'}
                  </p>
                </div>
              </div>
            </div>

            {/* Crypto Portfolio */}
            <div className="bg-slate-800 p-6 rounded-lg border border-slate-700">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <Bitcoin className="text-orange-400" size={24} />
                  <div>
                    <h3 className="font-bold">Crypto Portfolio</h3>
                    <p className="text-slate-400 text-sm">
                      {Object.values(portfolioData.crypto.account.balances).filter(b => b > 0).length} currencies
                    </p>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <div>
                  <p className="text-slate-400 text-sm">Total Value</p>
                  <p className="font-bold text-xl text-orange-400">
                    {showBalances ? `$${portfolioData.combined.cryptoValue.toLocaleString()}` : '****'}
                  </p>
                </div>
                <div>
                  <p className="text-slate-400 text-sm">Active Holdings</p>
                  <p className="font-medium">
                    {Object.values(portfolioData.crypto.account.balances).filter(b => b > 0).length} assets
                  </p>
                </div>
              </div>
            </div>

            {/* Portfolio Allocation */}
            <div className="bg-slate-800 p-6 rounded-lg border border-slate-700">
              <div className="flex items-center gap-3 mb-4">
                <PieChart className="text-green-400" size={24} />
                <div>
                  <h3 className="font-bold">Asset Allocation</h3>
                  <p className="text-slate-400 text-sm">Portfolio distribution</p>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 text-sm">Stocks</span>
                  <span className="font-medium">
                    {portfolioData.combined.totalValue > 0 
                      ? `${((portfolioData.combined.stockValue / portfolioData.combined.totalValue) * 100).toFixed(1)}%`
                      : '0%'
                    }
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 text-sm">Crypto</span>
                  <span className="font-medium">
                    {portfolioData.combined.totalValue > 0 
                      ? `${((portfolioData.combined.cryptoValue / portfolioData.combined.totalValue) * 100).toFixed(1)}%`
                      : '0%'
                    }
                  </span>
                </div>
                {/* Visual allocation bar */}
                <div className="w-full bg-slate-700 rounded-full h-2 mt-2">
                  <div className="flex h-full rounded-full overflow-hidden">
                    <div 
                      className="bg-blue-500"
                      style={{ 
                        width: portfolioData.combined.totalValue > 0 
                          ? `${(portfolioData.combined.stockValue / portfolioData.combined.totalValue) * 100}%`
                          : '0%'
                      }}
                    ></div>
                    <div 
                      className="bg-orange-500"
                      style={{ 
                        width: portfolioData.combined.totalValue > 0 
                          ? `${(portfolioData.combined.cryptoValue / portfolioData.combined.totalValue) * 100}%`
                          : '0%'
                      }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Crypto Holdings Overview */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <Bitcoin className="text-orange-500" />
              Crypto Holdings
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {Object.entries(portfolioData.crypto.account.balances).map(([currency, balance]) => {
                const price = getCryptoPrice(currency);
                const change = getCryptoChange(currency);
                const usdValue = balance * price;

                return (
                  <div key={currency} className="bg-slate-800 p-4 rounded-lg border border-slate-700">
                    <div className="flex items-center gap-2 mb-3">
                      {getCryptoIcon(currency)}
                      <div>
                        <h4 className="font-bold text-sm">{currency}</h4>
                        <div className={`flex items-center gap-1 text-xs ${change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {change >= 0 ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
                          {Math.abs(change)}%
                        </div>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-slate-400">Balance</p>
                      <p className="font-bold text-sm">
                        {showBalances ? `${balance.toFixed(4)}` : '****'}
                      </p>
                      <p className="text-xs text-green-400">
                        {showBalances ? `$${usdValue.toFixed(2)}` : '****'}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Recent Transactions */}
          <div className="bg-slate-800 rounded-lg border border-slate-700">
            <div className="p-6 border-b border-slate-700">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <History size={20} />
                Recent Crypto Transactions
              </h3>
            </div>
            <div className="p-6">
              {portfolioData.crypto.transactions.length > 0 ? (
                <div className="space-y-4">
                  {portfolioData.crypto.transactions.slice(0, 5).map((transaction) => (
                    <div key={transaction._id} className="flex items-center justify-between p-4 bg-slate-700 rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className={`p-2 rounded-full ${
                          transaction.type === 'deposit' ? 'bg-green-600/20' : 'bg-red-600/20'
                        }`}>
                          {transaction.type === 'deposit' ? (
                            <Plus className="w-4 h-4 text-green-400" />
                          ) : (
                            <Minus className="w-4 h-4 text-red-400" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium capitalize">
                            {transaction.type} {transaction.currency}
                          </p>
                          <p className="text-slate-400 text-sm">
                            {new Date(transaction.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <p className="font-medium">
                          {showBalances ? `${transaction.amount} ${transaction.currency}` : '****'}
                        </p>
                        <div className="flex items-center gap-2 text-sm">
                          {getStatusIcon(transaction.status)}
                          <span className={`capitalize ${
                            transaction.status === 'completed' ? 'text-green-400' :
                            transaction.status === 'pending' ? 'text-yellow-400' : 'text-red-400'
                          }`}>
                            {transaction.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Activity className="mx-auto mb-4 opacity-50" size={48} />
                  <p className="text-slate-400">No crypto transactions yet</p>
                  <p className="text-slate-500 text-sm mt-1">Your transaction history will appear here</p>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Unified Modals */}
      <UnifiedDepositModal
        isOpen={showDepositModal}
        onClose={() => setShowDepositModal(false)}
        portfolioData={portfolioData}
        onSuccess={handleTransactionSuccess}
      />
      
      <UnifiedWithdrawModal
        isOpen={showWithdrawModal}
        onClose={() => setShowWithdrawModal(false)}
        portfolioData={portfolioData}
        onSuccess={handleTransactionSuccess}
      />
    </div>
  );
}
