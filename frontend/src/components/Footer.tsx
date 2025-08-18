'use client';

import React from 'react';
import Link from 'next/link';
import { 
  Twitter, 
  Github, 
  Mail, 
  Phone, 
  MapPin, 
  TrendingUp,
  Shield,
  Clock,
  Users,
  ExternalLink
} from 'lucide-react';

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-slate-800 border-t border-slate-700 mt-auto">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          
          {/* Company Info */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-6 w-6 text-green-400" />
              <h3 className="text-lg font-bold text-white">TradingPlatform</h3>
            </div>
            <p className="text-sm text-gray-400 leading-relaxed">
              Advanced trading platform with real-time market data, 
              portfolio management, and comprehensive analytics tools.
            </p>
            <div className="flex space-x-3">
              <a 
                href="https://twitter.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-white transition-colors"
              >
                <Twitter className="h-5 w-5" />
              </a>
              <a 
                href="https://github.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-white transition-colors"
              >
                <Github className="h-5 w-5" />
              </a>
              <a 
                href="mailto:support@tradingplatform.com"
                className="text-gray-400 hover:text-white transition-colors"
              >
                <Mail className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-white uppercase tracking-wide">
              Platform
            </h4>
            <ul className="space-y-2">
              <li>
                <Link href="/dashboard" className="text-sm text-gray-400 hover:text-white transition-colors">
                  Dashboard
                </Link>
              </li>
              <li>
                <Link href="/portfolio" className="text-sm text-gray-400 hover:text-white transition-colors">
                  Portfolio
                </Link>
              </li>
              <li>
                <Link href="/watchlist" className="text-sm text-gray-400 hover:text-white transition-colors">
                  Watchlist
                </Link>
              </li>
              <li>
                <Link href="/trades" className="text-sm text-gray-400 hover:text-white transition-colors">
                  Trading History
                </Link>
              </li>
              <li>
                <Link href="/analytics" className="text-sm text-gray-400 hover:text-white transition-colors">
                  Analytics
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-white uppercase tracking-wide">
              Support
            </h4>
            <ul className="space-y-2">
              <li>
                <Link href="/help" className="text-sm text-gray-400 hover:text-white transition-colors">
                  Help Center
                </Link>
              </li>
              <li>
                <Link href="/api-docs" className="text-sm text-gray-400 hover:text-white transition-colors">
                  API Documentation
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-sm text-gray-400 hover:text-white transition-colors">
                  Contact Support
                </Link>
              </li>
              <li>
                <Link href="/status" className="text-sm text-gray-400 hover:text-white transition-colors flex items-center space-x-1">
                  <span>System Status</span>
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                </Link>
              </li>
              <li>
                <Link href="/security" className="text-sm text-gray-400 hover:text-white transition-colors">
                  Security
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact & Stats */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-white uppercase tracking-wide">
              Contact & Stats
            </h4>
            <div className="space-y-3">
              <div className="flex items-center space-x-2 text-sm text-gray-400">
                <Mail className="h-4 w-4 flex-shrink-0" />
                <span>support@trading.com</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-400">
                <Phone className="h-4 w-4 flex-shrink-0" />
                <span>+1 (555) 123-4567</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-400">
                <Clock className="h-4 w-4 flex-shrink-0" />
                <span>24/7 Support</span>
              </div>
            </div>
            
            {/* Platform Stats */}
            <div className="pt-2 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-400">Active Users</span>
                <span className="text-green-400 font-mono">12.4K+</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-400">Daily Volume</span>
                <span className="text-blue-400 font-mono">$2.8M</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-400">Uptime</span>
                <span className="text-purple-400 font-mono">99.9%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-8 pt-6 border-t border-slate-700">
          <div className="flex flex-col sm:flex-row justify-between items-center space-y-3 sm:space-y-0">
            <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-4 text-xs text-gray-400">
              <p>&copy; {currentYear} TradingPlatform. All rights reserved.</p>
              <div className="flex space-x-4">
                <Link href="/privacy" className="hover:text-white transition-colors">
                  Privacy Policy
                </Link>
                <Link href="/terms" className="hover:text-white transition-colors">
                  Terms of Service
                </Link>
                <Link href="/cookies" className="hover:text-white transition-colors">
                  Cookie Policy
                </Link>
              </div>
            </div>
            
            <div className="flex items-center space-x-4 text-xs text-gray-400">
              <div className="flex items-center space-x-1">
                <Shield className="h-3 w-3 text-green-400" />
                <span>SSL Secured</span>
              </div>
              <div className="flex items-center space-x-1">
                <Clock className="h-3 w-3 text-blue-400" />
                <span>Real-time Data</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
