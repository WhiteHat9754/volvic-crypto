'use client';

import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../contexts/AuthContext';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import {
  Users,
  DollarSign,
  TrendingUp,
  Activity,
  Settings,
  Edit,
  Trash2,
  Plus,
  Minus,
  Search,
  RefreshCw,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Eye,
  Filter,
  Download,
  Bitcoin,
  CreditCard
} from 'lucide-react';

interface User {
  _id: string;
  email: string;
  role: string;
  accountType: string;
  isActive: boolean;
  createdAt: string;
  lastLogin?: string;
  firstName?: string;
  lastName?: string;
}

interface Portfolio {
  _id: string;
  userId: string;
  totalValue: number;
  cashBalance: number;
  totalPnL: number;
  adminPnLAdjustment: number;
  stocks: Array<{
    symbol: string;
    quantity: number;
    purchasePrice: number;
    currentPrice: number;
  }>;
}

interface WithdrawalRequest {
  _id: string;
  userId: string;
  type: 'crypto' | 'fiat';
  currency: string;
  amount: number;
  toAddress?: string;
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  fee?: number;
  requestedAt: string;
  processedAt?: string;
  adminNotes?: string;
  user?: {
    email: string;
    firstName?: string;
    lastName?: string;
  };
}

interface SystemStats {
  totalUsers: number;
  totalPortfolioValue: number;
  totalTrades: number;
  activeUsers: number;
  pendingWithdrawals: number;
  totalWithdrawalAmount: number;
}

const AdminDashboard = () => {
  const { user } = useContext(AuthContext);
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [systemStats, setSystemStats] = useState<SystemStats>({
    totalUsers: 0,
    totalPortfolioValue: 0,
    totalTrades: 0,
    activeUsers: 0,
    pendingWithdrawals: 0,
    totalWithdrawalAmount: 0
  });
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [adjustmentAmount, setAdjustmentAmount] = useState<number>(0);
  const [adjustmentReason, setAdjustmentReason] = useState('');
  const [activeTab, setActiveTab] = useState<'users' | 'portfolios' | 'withdrawals'>('users');
  const [withdrawalFilter, setWithdrawalFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<WithdrawalRequest | null>(null);

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      router.push('/login');
      return;
    }
    fetchDashboardData();
  }, [user, router]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchUsers(),
        fetchPortfolios(),
        fetchWithdrawals(),
        fetchSystemStats()
      ]);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Error loading dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/admin/users`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setUsers(data.users || []);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchPortfolios = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/admin/portfolios`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setPortfolios(data.portfolios || []);
      }
    } catch (error) {
      console.error('Error fetching portfolios:', error);
    }
  };

  const fetchWithdrawals = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/admin/withdrawals`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setWithdrawals(data.withdrawals || []);
      }
    } catch (error) {
      console.error('Error fetching withdrawals:', error);
    }
  };

  const fetchSystemStats = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/admin/stats`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setSystemStats(data.stats || {});
      }
    } catch (error) {
      console.error('Error fetching system stats:', error);
    }
  };

  const adjustUserPnL = async (userId: string, adjustment: number, reason: string) => {
    if (!adjustment || !reason.trim()) {
      toast.error('Please enter adjustment amount and reason');
      return;
    }

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/admin/adjust-pnl`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId,
          adjustment,
          reason
        })
      });

      if (response.ok) {
        toast.success(`P&L adjusted by $${adjustment} for user`);
        setAdjustmentAmount(0);
        setAdjustmentReason('');
        setSelectedUser(null);
        fetchPortfolios();
      } else {
        const data = await response.json();
        toast.error(data.message || 'Error adjusting P&L');
      }
    } catch (error) {
      console.error('Error adjusting P&L:', error);
      toast.error('Error adjusting P&L');
    }
  };

  const handleWithdrawalAction = async (withdrawalId: string, action: 'approve' | 'reject', notes?: string) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/admin/withdrawals/${withdrawalId}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action,
          adminNotes: notes
        })
      });

      if (response.ok) {
        toast.success(`Withdrawal ${action}d successfully`);
        setSelectedWithdrawal(null);
        fetchWithdrawals();
        fetchSystemStats();
      } else {
        const data = await response.json();
        toast.error(data.error || `Error ${action}ing withdrawal`);
      }
    } catch (error) {
      console.error(`Error ${action}ing withdrawal:`, error);
      toast.error(`Error ${action}ing withdrawal`);
    }
  };

  const toggleUserStatus = async (userId: string, isActive: boolean) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/admin/users/${userId}/status`, {
        method: 'PATCH',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ isActive: !isActive })
      });

      if (response.ok) {
        toast.success(`User ${!isActive ? 'activated' : 'deactivated'} successfully`);
        fetchUsers();
      } else {
        toast.error('Error updating user status');
      }
    } catch (error) {
      console.error('Error updating user status:', error);
      toast.error('Error updating user status');
    }
  };

  const filteredUsers = users.filter(user =>
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (user.firstName && user.firstName.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (user.lastName && user.lastName.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const filteredWithdrawals = withdrawals.filter(withdrawal => {
    if (withdrawalFilter === 'all') return true;
    return withdrawal.status === withdrawalFilter;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'approved':
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getCurrencyIcon = (currency: string) => {
    switch (currency) {
      case 'BTC':
      case 'ETH':
      case 'LTC':
      case 'TRX':
        return <Bitcoin className="h-4 w-4 text-orange-500" />;
      default:
        return <CreditCard className="h-4 w-4 text-blue-500" />;
    }
  };

  if (loading && users.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="text-gray-600 mt-2">Manage users, portfolios, and withdrawal requests</p>
          </div>
          <button
            onClick={fetchDashboardData}
            disabled={loading}
            className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>

        {/* System Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900">{systemStats.totalUsers}</p>
                <p className="text-gray-600">Total Users</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <DollarSign className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900">${systemStats.totalPortfolioValue.toFixed(0)}</p>
                <p className="text-gray-600">Total Portfolio</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <TrendingUp className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900">{systemStats.totalTrades}</p>
                <p className="text-gray-600">Total Trades</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <Activity className="h-8 w-8 text-orange-600" />
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900">{systemStats.activeUsers}</p>
                <p className="text-gray-600">Active Users</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-yellow-600" />
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900">{systemStats.pendingWithdrawals}</p>
                <p className="text-gray-600">Pending Withdrawals</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <Minus className="h-8 w-8 text-red-600" />
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900">${systemStats.totalWithdrawalAmount.toFixed(0)}</p>
                <p className="text-gray-600">Withdrawal Amount</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex">
              <button
                onClick={() => setActiveTab('users')}
                className={`py-4 px-6 text-sm font-medium border-b-2 ${
                  activeTab === 'users'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Users ({users.length})
              </button>
              <button
                onClick={() => setActiveTab('portfolios')}
                className={`py-4 px-6 text-sm font-medium border-b-2 ${
                  activeTab === 'portfolios'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Portfolios ({portfolios.length})
              </button>
              <button
                onClick={() => setActiveTab('withdrawals')}
                className={`py-4 px-6 text-sm font-medium border-b-2 ${
                  activeTab === 'withdrawals'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Withdrawals ({withdrawals.filter(w => w.status === 'pending').length} pending)
              </button>
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === 'users' && (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                    <input
                      type="text"
                      placeholder="Search users..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          User
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Role & Type
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Joined
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Last Login
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredUsers.map((user) => (
                        <tr key={user._id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <p className="font-medium text-gray-900">{user.email}</p>
                              {(user.firstName || user.lastName) && (
                                <p className="text-sm text-gray-500">
                                  {user.firstName} {user.lastName}
                                </p>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              user.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                            }`}>
                              {user.role}
                            </span>
                            <span className={`ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              user.accountType === 'live' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {user.accountType}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}>
                              {user.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {new Date(user.createdAt).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex space-x-2">
                              <button
                                onClick={() => setSelectedUser(user._id)}
                                className="text-blue-600 hover:text-blue-900"
                              >
                                Adjust P&L
                              </button>
                              <button
                                onClick={() => toggleUserStatus(user._id, user.isActive)}
                                className={`${
                                  user.isActive ? 'text-red-600 hover:text-red-900' : 'text-green-600 hover:text-green-900'
                                }`}
                              >
                                {user.isActive ? 'Deactivate' : 'Activate'}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'portfolios' && (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        User
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Total Value
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Cash Balance
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        P&L
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Admin Adjustments
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Positions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {portfolios.map((portfolio) => {
                      const user = users.find(u => u._id === portfolio.userId);
                      return (
                        <tr key={portfolio._id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <p className="font-medium text-gray-900">{user?.email}</p>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                            ${portfolio.totalValue.toFixed(2)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            ${portfolio.cashBalance.toFixed(2)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <span className={`font-medium ${portfolio.totalPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              ${portfolio.totalPnL.toFixed(2)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">
                            ${portfolio.adminPnLAdjustment.toFixed(2)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {portfolio.stocks.length} positions
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {activeTab === 'withdrawals' && (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <div className="flex space-x-2">
                    {['all', 'pending', 'approved', 'rejected'].map((filter) => (
                      <button
                        key={filter}
                        onClick={() => setWithdrawalFilter(filter as any)}
                        className={`px-3 py-1 text-sm rounded-full ${
                          withdrawalFilter === filter
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        {filter.charAt(0).toUpperCase() + filter.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          User
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Type & Currency
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Amount
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Requested
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredWithdrawals.map((withdrawal) => (
                        <tr key={withdrawal._id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <p className="font-medium text-gray-900">{withdrawal.user?.email}</p>
                            {(withdrawal.user?.firstName || withdrawal.user?.lastName) && (
                              <p className="text-sm text-gray-500">
                                {withdrawal.user.firstName} {withdrawal.user.lastName}
                              </p>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              {getCurrencyIcon(withdrawal.currency)}
                              <div className="ml-2">
                                <p className="text-sm font-medium text-gray-900">{withdrawal.currency}</p>
                                <p className="text-sm text-gray-500">{withdrawal.type}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <p className="text-sm font-bold text-gray-900">{withdrawal.amount} {withdrawal.currency}</p>
                            {withdrawal.fee && (
                              <p className="text-sm text-gray-500">Fee: {withdrawal.fee} {withdrawal.currency}</p>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              {getStatusIcon(withdrawal.status)}
                              <span className={`ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                withdrawal.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                withdrawal.status === 'approved' ? 'bg-green-100 text-green-800' :
                                withdrawal.status === 'rejected' ? 'bg-red-100 text-red-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {withdrawal.status}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {new Date(withdrawal.requestedAt).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex space-x-2">
                              <button
                                onClick={() => setSelectedWithdrawal(withdrawal)}
                                className="text-blue-600 hover:text-blue-900"
                              >
                                <Eye className="h-4 w-4" />
                              </button>
                              {withdrawal.status === 'pending' && (
                                <>
                                  <button
                                    onClick={() => handleWithdrawalAction(withdrawal._id, 'approve')}
                                    className="text-green-600 hover:text-green-900"
                                  >
                                    <CheckCircle className="h-4 w-4" />
                                  </button>
                                  <button
                                    onClick={() => handleWithdrawalAction(withdrawal._id, 'reject')}
                                    className="text-red-600 hover:text-red-900"
                                  >
                                    <XCircle className="h-4 w-4" />
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* P&L Adjustment Modal */}
        {selectedUser && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-md w-full p-6">
              <h3 className="text-lg font-semibold mb-4">Adjust User P&L</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Adjustment Amount ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={adjustmentAmount}
                    onChange={(e) => setAdjustmentAmount(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter amount (positive or negative)"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Reason for Adjustment
                  </label>
                  <textarea
                    value={adjustmentReason}
                    onChange={(e) => setAdjustmentReason(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Explain the reason for this adjustment..."
                  />
                </div>

                <div className="flex space-x-3 pt-4">
                  <button
                    onClick={() => adjustUserPnL(selectedUser, adjustmentAmount, adjustmentReason)}
                    className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 font-medium"
                  >
                    Apply Adjustment
                  </button>
                  <button
                    onClick={() => {
                      setSelectedUser(null);
                      setAdjustmentAmount(0);
                      setAdjustmentReason('');
                    }}
                    className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400 font-medium"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Withdrawal Details Modal */}
        {selectedWithdrawal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-lg w-full p-6">
              <h3 className="text-lg font-semibold mb-4">Withdrawal Details</h3>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-700">User</p>
                    <p className="text-sm text-gray-900">{selectedWithdrawal.user?.email}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">Amount</p>
                    <p className="text-sm text-gray-900">{selectedWithdrawal.amount} {selectedWithdrawal.currency}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">Type</p>
                    <p className="text-sm text-gray-900">{selectedWithdrawal.type}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">Status</p>
                    <p className="text-sm text-gray-900">{selectedWithdrawal.status}</p>
                  </div>
                </div>

                {selectedWithdrawal.toAddress && (
                  <div>
                    <p className="text-sm font-medium text-gray-700">Withdrawal Address</p>
                    <p className="text-sm text-gray-900 font-mono break-all">{selectedWithdrawal.toAddress}</p>
                  </div>
                )}

                {selectedWithdrawal.adminNotes && (
                  <div>
                    <p className="text-sm font-medium text-gray-700">Admin Notes</p>
                    <p className="text-sm text-gray-900">{selectedWithdrawal.adminNotes}</p>
                  </div>
                )}

                <div className="flex space-x-3 pt-4">
                  {selectedWithdrawal.status === 'pending' && (
                    <>
                      <button
                        onClick={() => handleWithdrawalAction(selectedWithdrawal._id, 'approve')}
                        className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 font-medium"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleWithdrawalAction(selectedWithdrawal._id, 'reject')}
                        className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 font-medium"
                      >
                        Reject
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => setSelectedWithdrawal(null)}
                    className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400 font-medium"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
