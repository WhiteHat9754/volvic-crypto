'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  TrendingUp, TrendingDown, Star, Shield, Zap, Users,
  BarChart3, Smartphone, Globe, ArrowRight, CheckCircle,
  Play, Menu, X, Eye, Lock, Clock, Award
} from 'lucide-react';

// Animated counter hook
const useCounter = (end: number, duration: number = 2000) => {
  const [count, setCount] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !isVisible) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [isVisible]);

  useEffect(() => {
    if (!isVisible) return;

    let startTime: number;
    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / duration, 1);
      setCount(Math.floor(progress * end));

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [isVisible, end, duration]);

  return { count, ref };
};

// Mock price data
const mockPrices = [
  { symbol: 'BTC', name: 'Bitcoin', price: 68459.32, change: 2.47, icon: '₿' },
  { symbol: 'ETH', name: 'Ethereum', price: 3842.15, change: -1.23, icon: 'Ξ' },
  { symbol: 'SOL', name: 'Solana', price: 142.67, change: 4.81, icon: '◎' },
  { symbol: 'ADA', name: 'Cardano', price: 0.6234, change: -0.89, icon: '₳' },
];

const LandingPage: React.FC = () => {
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [currentPriceIndex, setCurrentPriceIndex] = useState(0);

  // Auto-rotate prices
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentPriceIndex((prev) => (prev + 1) % mockPrices.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // Counter hooks
  const tradersCount = useCounter(500000);
  const cryptosCount = useCounter(500);
  const uptimeCount = useCounter(99.9);
  const countriesCount = useCounter(150);

  const handleGetStarted = () => {
    router.push('/register');
  };

  const handleLogin = () => {
    router.push('/login');
  };

  const handleWatchDemo = () => {
    router.push('/demo');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-900 to-blue-900/20">
      {/* Background Pattern */}
      <div className="fixed inset-0 opacity-10">
        <div 
          className="w-full h-full"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='1'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
          }}
        />
      </div>

      {/* Navigation */}
      <nav className="fixed w-full z-50 bg-black/20 backdrop-blur-lg border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center cursor-pointer" onClick={() => router.push('/')}>
              <div className="w-10 h-10 bg-gradient-to-r from-emerald-500 to-blue-500 rounded-2xl flex items-center justify-center mr-3">
                <TrendingUp className="h-6 w-6 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-emerald-400 to-blue-500 bg-clip-text text-transparent">
                Quota Flow
              </span>
            </div>
            
            {/* Desktop Navigation */}
            <div className="hidden md:flex space-x-8">
              <a href="#features" className="text-gray-300 hover:text-white transition-colors">Features</a>
              {/* <a href="#trading" className="text-gray-300 hover:text-white transition-colors">Trading</a>
              <a href="#security" className="text-gray-300 hover:text-white transition-colors">Security</a>
              <a href="#pricing" className="text-gray-300 hover:text-white transition-colors">Pricing</a> */}
            </div>
            
            {/* Desktop Auth Buttons */}
            <div className="hidden md:flex space-x-4">
              <button 
                onClick={handleLogin}
                className="px-4 py-2 text-gray-300 hover:text-white transition-colors"
              >
                Login
              </button>
              <button 
                onClick={handleGetStarted}
                className="px-6 py-2 bg-gradient-to-r from-emerald-500 to-blue-500 rounded-lg hover:opacity-90 transition-opacity font-semibold"
              >
                Start Trading
              </button>
            </div>

            {/* Mobile Menu Button */}
            <button 
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-black/90 backdrop-blur-lg border-t border-white/10">
            <div className="px-4 py-6 space-y-4">
              <a href="#features" className="block text-gray-300 hover:text-white transition-colors">Features</a>
              {/* <a href="#trading" className="block text-gray-300 hover:text-white transition-colors">Trading</a>
              <a href="#security" className="block text-gray-300 hover:text-white transition-colors">Security</a>
              <a href="#pricing" className="block text-gray-300 hover:text-white transition-colors">Pricing</a> */}
              <div className="pt-4 border-t border-gray-700 space-y-3">
                <button 
                  onClick={handleLogin}
                  className="block w-full text-left text-gray-300"
                >
                  Login
                </button>
                <button 
                  onClick={handleGetStarted}
                  className="block w-full px-6 py-2 bg-gradient-to-r from-emerald-500 to-blue-500 rounded-lg font-semibold text-center"
                >
                  Start Trading
                </button>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 relative overflow-hidden">
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              {/* Status Badge */}
              <div className="inline-flex items-center px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-emerald-400 text-sm">
                <div className="w-2 h-2 bg-emerald-500 rounded-full mr-2 animate-pulse"></div>
                Live Market Data • Real-time Trading
              </div>
              
              {/* Main Heading */}
              <h1 className="text-5xl lg:text-7xl font-bold leading-tight">
                Trade Like a{' '}
                <span className="bg-gradient-to-r from-emerald-400 via-blue-500 to-purple-500 bg-clip-text text-transparent">
                  Professional
                </span>
              </h1>
              
              {/* Subtitle */}
              <p className="text-xl text-gray-300 leading-relaxed max-w-2xl">
                Advanced trading tools, institutional-grade security, and lightning-fast execution. 
                Join thousands of traders who trust Quota Flow for their investments.
              </p>
              
              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4">
                <button 
                  onClick={handleGetStarted}
                  className="px-8 py-4 bg-gradient-to-r from-emerald-500 to-blue-500 rounded-lg text-lg font-semibold hover:opacity-90 transition-all transform hover:scale-105 flex items-center justify-center"
                >
                  Start Trading Now
                  <ArrowRight className="ml-2 h-5 w-5" />
                </button>
                <button 
                  onClick={handleWatchDemo}
                  className="px-8 py-4 border border-gray-600 rounded-lg text-lg font-semibold hover:bg-gray-800 transition-colors flex items-center justify-center"
                >
                  <Play className="mr-2 h-5 w-5" />
                  Watch Demo
                </button>
              </div>
              
              {/* Trust Indicators */}
              <div className="flex flex-wrap items-center gap-8 text-sm text-gray-400">
                <div className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-emerald-500 mr-2" />
                  No Hidden Fees
                </div>
                <div className="flex items-center">
                  <Shield className="w-5 h-5 text-emerald-500 mr-2" />
                  Bank-Level Security
                </div>
                <div className="flex items-center">
                  <Clock className="w-5 h-5 text-emerald-500 mr-2" />
                  24/7 Support
                </div>
              </div>
            </div>
            
            {/* Hero Visual */}
            <div className="relative">
              {/* Main Card */}
              <div className="bg-gray-800/30 backdrop-blur-lg border border-gray-700/30 rounded-2xl p-6 shadow-2xl">
                <div className="flex items-center justify-between mb-6">
                  <div className="text-gray-400 text-sm">Live Prices</div>
                  <div className="flex items-center text-emerald-500 text-sm">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full mr-2 animate-pulse"></div>
                    LIVE
                  </div>
                </div>
                
                {/* Price Display */}
                <div className="space-y-4">
                  {mockPrices.map((crypto, index) => (
                    <div 
                      key={crypto.symbol}
                      className={`flex items-center justify-between p-3 rounded-lg transition-all ${
                        index === currentPriceIndex 
                          ? 'bg-gradient-to-r from-emerald-500/10 to-blue-500/10 border border-emerald-500/20' 
                          : 'bg-gray-700/20'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-blue-500 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                          {crypto.icon}
                        </div>
                        <div>
                          <div className="font-semibold text-white">{crypto.symbol}</div>
                          <div className="text-xs text-gray-400">{crypto.name}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-white">
                          ${crypto.price.toLocaleString()}
                        </div>
                        <div className={`text-sm ${crypto.change >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                          {crypto.change >= 0 ? '+' : ''}{crypto.change}%
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Floating Elements */}
              <div className="absolute -top-4 -right-4 bg-gray-800/90 backdrop-blur-lg rounded-lg p-4 border border-gray-700 animate-bounce">
                <div className="text-sm text-gray-400">Portfolio</div>
                <div className="text-2xl font-bold text-emerald-400">$24,891</div>
                <div className="text-sm text-emerald-400">+12.8%</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 border-y border-gray-800">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center" ref={tradersCount.ref}>
              <div className="text-4xl font-bold text-emerald-400 mb-2">
                {tradersCount.count.toLocaleString()}+
              </div>
              <div className="text-gray-400">Active Traders</div>
            </div>
            <div className="text-center" ref={cryptosCount.ref}>
              <div className="text-4xl font-bold text-blue-400 mb-2">
                {cryptosCount.count}+
              </div>
              <div className="text-gray-400">Cryptocurrencies</div>
            </div>
            <div className="text-center" ref={uptimeCount.ref}>
              <div className="text-4xl font-bold text-purple-400 mb-2">
                {uptimeCount.count}%
              </div>
              <div className="text-gray-400">Uptime</div>
            </div>
            <div className="text-center" ref={countriesCount.ref}>
              <div className="text-4xl font-bold text-yellow-400 mb-2">
                {countriesCount.count}+
              </div>
              <div className="text-gray-400">Countries</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold mb-4">
              Why Choose{' '}
              <span className="bg-gradient-to-r from-emerald-400 to-blue-500 bg-clip-text text-transparent">
                CryptoFlow
              </span>
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Built for traders who demand the best. Our platform combines cutting-edge technology with intuitive design.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: Zap,
                title: 'Instant Execution',
                description: 'Lightning-fast order execution with minimal slippage. Trade at the speed of thought.',
                color: 'emerald'
              },
              {
                icon: BarChart3,
                title: 'Advanced Charts',
                description: 'Professional trading tools with 50+ technical indicators and drawing tools.',
                color: 'blue'
              },
              {
                icon: Shield,
                title: 'Military-Grade Security',
                description: 'Multi-layer security with cold storage, 2FA, and insurance coverage.',
                color: 'purple'
              },
              {
                icon: Globe,
                title: 'Global Access',
                description: 'Trade from anywhere in the world with our global infrastructure.',
                color: 'green'
              },
              {
                icon: Smartphone,
                title: 'Mobile Trading',
                description: 'Trade on-the-go with our award-winning mobile app for iOS and Android.',
                color: 'yellow'
              },
              {
                icon: Users,
                title: '24/7 Support',
                description: 'Round-the-clock customer support with live chat and phone assistance.',
                color: 'red'
              }
            ].map((feature, index) => (
              <div 
                key={index}
                className="bg-gray-800/30 backdrop-blur-lg border border-gray-700/30 rounded-2xl p-8 hover:bg-gray-800/50 transition-all duration-300 transform hover:scale-105"
              >
                <div className={`w-12 h-12 bg-${feature.color}-500/20 rounded-lg flex items-center justify-center mb-6`}>
                  <feature.icon className={`w-6 h-6 text-${feature.color}-400`} />
                </div>
                <h3 className="text-xl font-bold mb-4 text-white">{feature.title}</h3>
                <p className="text-gray-400">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-to-r from-emerald-500/10 to-blue-500/10">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl lg:text-5xl font-bold mb-6">
            Ready to Start Trading?
          </h2>
          <p className="text-xl text-gray-300 mb-8">
            Join thousands of traders who trust CryptoFlow for their crypto investments.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button 
              onClick={handleGetStarted}
              className="px-8 py-4 bg-gradient-to-r from-emerald-500 to-blue-500 rounded-lg text-lg font-semibold hover:opacity-90 transition-opacity"
            >
              Create Free Account
            </button>
            <button 
              onClick={handleWatchDemo}
              className="px-8 py-4 border border-gray-600 rounded-lg text-lg font-semibold hover:bg-gray-800 transition-colors"
            >
              Explore Platform
            </button>
          </div>
        </div>
      </section>


    </div>
  );
};

export default LandingPage;
