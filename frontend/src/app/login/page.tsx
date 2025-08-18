'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';
import { 
  LogIn, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  TrendingUp, 
  ArrowRight,
  Shield,
  Zap,
  Star,
  BarChart3,
  Activity,
  Target
} from 'lucide-react';
import Link from 'next/link';

const LoginPage = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isAnimated, setIsAnimated] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  useEffect(() => {
    setIsAnimated(true);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.email || !formData.password) {
      toast.error('Please fill in all fields');
      return;
    }

    setLoading(true);
    
    try {
      const success = await login(formData.email, formData.password);
      if (success) {
        toast.success('Welcome back! 🎉', {
          icon: '🚀',
          style: {
            borderRadius: '12px',
            background: '#10B981',
            color: '#fff',
          },
        });
        setTimeout(() => {
          router.push('/dashboard');
        }, 1000);
      } else {
        toast.error('Invalid email or password', {
          style: {
            borderRadius: '12px',
            background: '#EF4444',
            color: '#fff',
          },
        });
      }
    } catch (error) {
      toast.error('An error occurred during login');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Hero Section with Sharp Logo */}
      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-blue-900 via-indigo-800 to-purple-900 relative overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 bg-black/20" />
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-blue-400 rounded-full blur-3xl opacity-20 animate-pulse" />
        <div className="absolute bottom-1/4 left-1/4 w-80 h-80 bg-purple-400 rounded-full blur-3xl opacity-20 animate-pulse" />
        
        {/* Animated Grid Background */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.15)_1px,transparent_0)] bg-[size:50px_50px] opacity-30"></div>
        
        <div className="relative z-10 flex flex-col justify-center items-center px-12 text-white">

{/* Small Yellow Logo - Updated */}
<div className={`mb-12 transform transition-all duration-1000 delay-200 ${
  isAnimated ? 'scale-100 opacity-100' : 'scale-75 opacity-0'
}`}>
  <div className="relative w-48 h-48 flex items-center justify-center">
    {/* Sharp Outer Frame - Yellow Theme */}
    <div className="absolute inset-0 border-2 border-transparent bg-gradient-to-r from-yellow-400 via-amber-500 to-orange-500 rounded-lg p-[2px] animate-pulse-slow">
      <div className="w-full h-full bg-slate-900 rounded-md flex items-center justify-center relative overflow-hidden">
        {/* Animated Background Lines - Yellow */}
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-yellow-400 to-transparent animate-pulse"></div>
          <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-amber-400 to-transparent animate-pulse"></div>
          <div className="absolute left-0 top-0 w-px h-full bg-gradient-to-b from-transparent via-orange-400 to-transparent animate-pulse"></div>
          <div className="absolute right-0 top-0 w-px h-full bg-gradient-to-b from-transparent via-yellow-500 to-transparent animate-pulse"></div>
        </div>
        
        {/* Sharp Logo Text - Yellow */}
        <div className="relative z-10 text-center">
          <div className="text-3xl font-black tracking-tight mb-1">
            <span className="text-white">QUOTA</span>
            <span className="bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">FLOW</span>
          </div>
          <div className="w-16 h-0.5 bg-gradient-to-r from-yellow-400 to-orange-400 mx-auto mb-2 animate-pulse"></div>
          <div className="text-[10px] text-gray-400 tracking-[0.2em] font-mono">
            PRECISION TRADING
          </div>
        </div>

        {/* Corner Status Indicators - Yellow Theme */}
        <div className="absolute top-2 left-2 w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse shadow-sm shadow-green-400/50"></div>
        <div className="absolute top-2 right-2 w-1.5 h-1.5 bg-yellow-400 rounded-full animate-pulse shadow-sm shadow-yellow-400/50"></div>
        <div className="absolute bottom-2 left-2 w-1.5 h-1.5 bg-amber-400 rounded-full animate-pulse shadow-sm shadow-amber-400/50"></div>
        <div className="absolute bottom-2 right-2 w-1.5 h-1.5 bg-orange-400 rounded-full animate-pulse shadow-sm shadow-orange-400/50"></div>
      </div>
    </div>

    {/* Orbiting Sharp Elements - Yellow */}
    {[...Array(4)].map((_, i) => (
      <div
        key={i}
        className="absolute"
        style={{
          transform: `rotate(${i * 90}deg) translateX(75px) rotate(-${i * 90}deg)`,
          animation: `orbit 10s linear infinite ${i * 1.5}s`
        }}
      >
        <div className="w-2 h-2 bg-gradient-to-r from-yellow-500 to-amber-500 transform rotate-45 shadow-md animate-pulse"></div>
      </div>
    ))}

    {/* Data Flow Lines - Yellow */}
    <div className="absolute inset-0">
      {[...Array(6)].map((_, i) => (
        <div
          key={i}
          className="absolute w-px h-3 bg-gradient-to-b from-yellow-400 to-transparent opacity-60"
          style={{
            left: '50%',
            top: '50%',
            transformOrigin: 'bottom',
            transform: `rotate(${i * 60}deg) translateY(-60px)`,
            animation: `pulse ${1.5 + (i * 0.15)}s infinite ${i * 0.1}s`
          }}
        />
      ))}
    </div>
  </div>
</div>



          {/* Hero Content */}
          <div className={`text-center transform transition-all duration-1000 delay-500 ${
            isAnimated ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
          }`}>
            <h2 className="text-5xl font-bold mb-6">
              Welcome Back to
              <span className="block bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                QuotaFlow
              </span>
            </h2>
            <p className="text-xl text-blue-100 mb-8 leading-relaxed max-w-md">
              Continue your trading journey with advanced analytics and real-time market insights.
            </p>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-6 max-w-sm mx-auto">
              <div className="text-center p-4 bg-white/10 rounded-2xl backdrop-blur-sm border border-white/20">
                <div className="text-2xl font-bold text-blue-400">24/7</div>
                <div className="text-sm text-blue-200">Market Access</div>
              </div>
              <div className="text-center p-4 bg-white/10 rounded-2xl backdrop-blur-sm border border-white/20">
                <div className="text-2xl font-bold text-purple-400">8K+</div>
                <div className="text-sm text-purple-200">Assets</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 bg-white relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-purple-100 opacity-50" />
        <div className="absolute top-0 left-0 w-40 h-40 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full blur-3xl opacity-20 animate-pulse" />
        <div className="absolute bottom-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-400 to-pink-500 rounded-full blur-3xl opacity-20 animate-pulse" />
        
        <div className={`w-full max-w-md relative z-10 transform transition-all duration-1000 ${
          isAnimated ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
        }`}>
          {/* Header */}
          <div className="text-center mb-8">
            <div className="mx-auto h-16 w-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg relative overflow-hidden">
              <LogIn className="h-8 w-8 text-white z-10" />
              <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-400 animate-pulse opacity-50"></div>
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
              Welcome Back
            </h1>
            <p className="text-gray-600 mt-2">Sign in to your QuotaFlow account</p>
          </div>

          {/* Login Form */}
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-white/20 p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Email Field */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Email Address
                </label>
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5 group-focus-within:text-blue-600 transition-colors" />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full pl-12 pr-4 py-4 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50/50 hover:bg-white"
                    placeholder="Enter your email"
                    required
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Password
                </label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5 group-focus-within:text-blue-600 transition-colors" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    className="w-full pl-12 pr-12 py-4 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50/50 hover:bg-white"
                    placeholder="Enter your password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              {/* Remember Me & Forgot Password */}
              <div className="flex items-center justify-between">
                <label className="flex items-center cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="sr-only"
                  />
                  <div className={`w-5 h-5 rounded border-2 mr-3 flex items-center justify-center transition-all duration-300 ${
                    rememberMe 
                      ? 'bg-gradient-to-r from-blue-500 to-purple-500 border-blue-500' 
                      : 'border-gray-300 group-hover:border-blue-400'
                  }`}>
                    {rememberMe && (
                      <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                  <span className="text-sm text-gray-600 group-hover:text-gray-900 transition-colors">
                    Remember me
                  </span>
                </label>
                <a href="#" className="text-sm text-blue-600 hover:text-blue-700 transition-colors hover:underline">
                  Forgot password?
                </a>
              </div>

              {/* Sign In Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 px-6 rounded-2xl hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-lg transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-xl group"
              >
                {loading ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Signing in...</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center space-x-2">
                    <span>Sign In</span>
                    <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </div>
                )}
              </button>
            </form>

            {/* Create Account Link */}
            <div className="mt-6 text-center">
              <p className="text-gray-600">
                Don't have an account?{' '}
                <Link
                  href="/register"
                  className="font-semibold text-blue-600 hover:text-blue-700 transition-colors"
                >
                  Create account
                </Link>
              </p>
            </div>
          </div>

          {/* Trust Indicators */}
          <div className="mt-8 text-center">
            <div className="flex items-center justify-center space-x-6 text-gray-500">
              <div className="flex items-center space-x-2">
                <Shield className="h-5 w-5" />
                <span className="text-sm">Secure</span>
              </div>
              <div className="flex items-center space-x-2">
                <Zap className="h-5 w-5" />
                <span className="text-sm">Fast</span>
              </div>
              <div className="flex items-center space-x-2">
                <Star className="h-5 w-5" />
                <span className="text-sm">Trusted</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
