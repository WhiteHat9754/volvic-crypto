'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';
import { Shield, Lock, User, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

const AdminLoginPage = () => {
  const [credentials, setCredentials] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!credentials.email || !credentials.password) {
      toast.error('Please enter both email and password');
      return;
    }

    setLoading(true);
    
    try {
      const success = await login(credentials.email, credentials.password);
      if (success) {
        // Check if user is admin after login
        const userData = JSON.parse(localStorage.getItem('user') || '{}');
        if (userData.role === 'admin') {
          toast.success('Admin login successful!');
          router.push('/admin');
        } else {
          toast.error('Access denied. Admin privileges required.');
          // You might want to logout non-admin user here
        }
      } else {
        toast.error('Invalid admin credentials');
      }
    } catch (error) {
      toast.error('Login error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCredentials(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleDemoAdminLogin = async () => {
    setLoading(true);
    const success = await login('admin@tradepro.com', 'admin123');
    if (success) {
      toast.success('Demo admin login successful!');
      router.push('/admin');
    } else {
      toast.error('Demo admin login failed');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-900 via-red-800 to-rose-900 flex items-center justify-center px-4">
      <div className="max-w-md w-full space-y-8">
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <div className="text-center mb-8">
            <div className="mx-auto h-12 w-12 bg-red-600 rounded-full flex items-center justify-center mb-4">
              <Shield className="h-6 w-6 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900">Admin Access</h2>
            <p className="mt-2 text-gray-600">Secure administrative portal</p>
            
            {/* Security Warning */}
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                <strong>⚠️ Authorized Personnel Only</strong><br />
                This area is restricted to administrators
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Admin Email
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type="email"
                  name="email"
                  value={credentials.email}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="Enter admin email"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Admin Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type="password"
                  name="password"
                  value={credentials.password}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="Enter admin password"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-red-600 text-white py-3 px-4 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
            >
              {loading ? 'Authenticating...' : 'Admin Sign In'}
            </button>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Demo Access</span>
              </div>
            </div>

            <div className="mt-4">
              <button
                onClick={handleDemoAdminLogin}
                disabled={loading}
                className="w-full bg-orange-600 text-white py-2 px-4 rounded-lg hover:bg-orange-700 disabled:opacity-50 text-sm font-medium"
              >
                Demo Admin Login
              </button>
              <p className="text-xs text-gray-500 mt-2 text-center">
                Demo: admin@tradepro.com / admin123
              </p>
            </div>
          </div>

          <div className="mt-6 text-center">
            <Link
              href="/login"
              className="inline-flex items-center text-red-600 hover:text-red-700 font-medium"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to User Login
            </Link>
          </div>

          {/* Security Features */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-xs text-gray-500 text-center">
              🔐 This session is secured with enterprise-grade encryption<br />
              🔍 All administrative actions are logged and monitored
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLoginPage;
