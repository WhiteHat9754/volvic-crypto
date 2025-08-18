'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketContext';
import { 
  Home, 
  TrendingUp, 
  Briefcase, 
  Settings, 
  LogOut, 
  Wifi, 
  WifiOff,
  Shield,
  User,
  ChevronDown,
  Menu,
  X,
  Bell,
  HelpCircle,
  RefreshCw,
  DollarSign,
  Activity
} from 'lucide-react';

const Navbar = () => {
  const { user, logout } = useAuth();
  const { 
    connected, 
    navbarData, 
    isLoadingNavbar, 
    requestNavbarUpdate 
  } = useSocket();
  const router = useRouter();
  const pathname = usePathname();
  
  // State management
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  
  // Refs for click outside detection
  const profileDropdownRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target as Node)) {
        setIsMobileMenuOpen(false);
      }
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setIsNotificationsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    setIsProfileOpen(false);
    setIsMobileMenuOpen(false);
    router.push('/login');
  };

  const handleProfileClick = () => {
    setIsProfileOpen(!isProfileOpen);
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
    setIsProfileOpen(false);
  };

  const toggleNotifications = () => {
    setIsNotificationsOpen(!isNotificationsOpen);
  };

  if (!user) return null;

  // Navigation items based on user role
  const navigationItems = [
    { 
      name: 'Dashboard', 
      href: '/dashboard', 
      icon: Home,
      description: 'Overview and stats'
    },
    { 
      name: 'Trading', 
      href: '/trading', 
      icon: TrendingUp,
      description: 'Buy and sell stocks'
    },
    { 
      name: 'Portfolio', 
      href: '/portfolio', 
      icon: Briefcase,
      description: 'View your holdings'
    },
    // { 
    //   name: 'Crypto', 
    //   href: '/crypto', 
    //   icon: Briefcase,
    //   description: 'View your holdings'
    // },
    { 
      name: 'Wallet', 
      href: '/wallet', 
      icon: Briefcase,
      description: 'View your holdings'
    },
    ...(user.role === 'admin' ? [{
      name: 'Admin', 
      href: '/admin', 
      icon: Shield,
      description: 'Platform management'
    }] : []),
  ];

  const profileMenuItems = [
    {
      name: 'Settings',
      icon: Settings,
      onClick: () => {
        setIsProfileOpen(false);
        console.log('Navigate to settings');
      }
    },
    {
      name: 'Help & Support',
      icon: HelpCircle,
      onClick: () => {
        setIsProfileOpen(false);
        console.log('Navigate to help');
      }
    },
    {
      name: 'Logout',
      icon: LogOut,
      onClick: handleLogout,
      className: 'text-red-400 hover:text-red-300 hover:bg-red-900/20'
    }
  ];

  return (
    <nav className="bg-slate-800 shadow-lg border-b border-slate-700 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo and Brand */}
          <div className="flex items-center">
            <Link href="/dashboard" className="flex items-center space-x-3 hover:opacity-80 transition-opacity">
              <div className="p-2 bg-green-600 rounded-lg">
                <TrendingUp className="h-6 w-6 text-white" />
              </div>
              <div className="hidden sm:block">
                <span className="text-xl font-bold text-white">Quota Flow</span>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            {navigationItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 group ${
                    isActive
                      ? 'bg-green-600 text-white shadow-sm'
                      : 'text-gray-300 hover:text-white hover:bg-slate-700'
                  }`}
                  title={item.description}
                >
                  <item.icon className={`h-4 w-4 ${isActive ? 'text-white' : 'text-gray-400 group-hover:text-gray-200'}`} />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </div>

          {/* Right Side Items */}
          <div className="flex items-center space-x-4">
            {/* Quick Stats Display */}
            {navbarData && (
              <div className="hidden lg:flex items-center space-x-4 px-3 py-1 bg-slate-700 rounded-lg">
                <div className="flex items-center space-x-1 text-xs">
                  <DollarSign className="h-3 w-3 text-green-400" />
                  <span className="text-white font-mono">
                    ${navbarData.quickStats.balance.toLocaleString()}
                  </span>
                </div>
                <div className={`flex items-center space-x-1 text-xs ${
                  navbarData.quickStats.todayPnL >= 0 ? 'text-green-400' : 'text-red-400'
                }`}>
                  <Activity className="h-3 w-3" />
                  <span className="font-mono">
                    {navbarData.quickStats.todayPnL >= 0 ? '+' : ''}${navbarData.quickStats.todayPnL}
                  </span>
                </div>
              </div>
            )}


            {/* Refresh Button */}
            <button
              onClick={requestNavbarUpdate}
              disabled={isLoadingNavbar}
              className="p-2 text-gray-400 hover:text-gray-200 transition-colors rounded-lg hover:bg-slate-700 disabled:opacity-50"
              title="Refresh data"
            >
              <RefreshCw className={`h-4 w-4 ${isLoadingNavbar ? 'animate-spin' : ''}`} />
            </button>

            {/* Notifications */}
            <div className="relative" ref={notificationsRef}>
              <button
                onClick={toggleNotifications}
                className="p-2 text-gray-400 hover:text-gray-200 transition-colors rounded-lg hover:bg-slate-700"
              >
                <Bell className="h-5 w-5" />
                {navbarData && navbarData.notifications.unread > 0 && (
                  <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                    {navbarData.notifications.unread}
                  </span>
                )}
              </button>

              {/* Notifications Dropdown */}
              {isNotificationsOpen && navbarData && (
                <div className="absolute right-0 mt-2 w-80 bg-slate-800 rounded-xl shadow-lg border border-slate-700 py-2 z-50">
                  <div className="px-4 py-2 border-b border-slate-700">
                    <h3 className="text-sm font-medium text-white">Notifications</h3>
                  </div>
                  <div className="max-h-64 overflow-y-auto">
                    {navbarData.notifications.latest.length > 0 ? (
                      navbarData.notifications.latest.map((notification) => (
                        <div 
                          key={notification.id} 
                          className="px-4 py-3 hover:bg-slate-700 border-b border-slate-700 last:border-b-0"
                        >
                          <p className="text-sm text-gray-300">{notification.message}</p>
                          <p className="text-xs text-gray-400 mt-1">
                            {new Date(notification.time).toLocaleTimeString()}
                          </p>
                        </div>
                      ))
                    ) : (
                      <div className="px-4 py-3 text-center text-gray-400">
                        No notifications
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Profile Dropdown */}
            <div className="relative" ref={profileDropdownRef}>
              <button
                onClick={handleProfileClick}
                className={`flex items-center space-x-3 p-2 rounded-lg hover:bg-slate-700 transition-colors ${
                  isProfileOpen ? 'bg-slate-700' : ''
                }`}
              >
                <div className="flex items-center space-x-2">
                  <div className="h-8 w-8 bg-gradient-to-r from-green-500 to-blue-600 rounded-full flex items-center justify-center">
                    <User className="h-4 w-4 text-white" />
                  </div>
                  <div className="hidden sm:block text-left">
                    <p className="text-sm font-medium text-white truncate max-w-32">
                      {user.email.split('@')[0]}
                    </p>
                  </div>
                  <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${
                    isProfileOpen ? 'rotate-180' : ''
                  }`} />
                </div>
              </button>

              {/* Profile Dropdown Menu */}
              {isProfileOpen && (
                <div className="absolute right-0 mt-2 w-72 bg-slate-800 rounded-xl shadow-lg border border-slate-700 py-2 z-50">
                  {/* User Info Header */}
                  <div className="px-4 py-3 border-b border-slate-700">
                    <div className="flex items-center space-x-3">
                      <div className="h-10 w-10 bg-gradient-to-r from-green-500 to-blue-600 rounded-full flex items-center justify-center">
                        <User className="h-5 w-5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">
                          {user.email}
                        </p>
                        <div className="flex items-center space-x-2 mt-1">
                          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                            user.role === 'admin' 
                              ? 'bg-purple-900/30 text-purple-400'
                              : 'bg-green-900/30 text-green-400'
                          }`}>
                            {user.role}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Quick Stats in Profile */}
                  {navbarData && (
                    <div className="px-4 py-3 border-b border-slate-700">
                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div>
                          <p className="text-gray-400">Balance</p>
                          <p className="text-white font-mono">${navbarData.quickStats.balance.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-gray-400">Today P&L</p>
                          <p className={`font-mono ${navbarData.quickStats.todayPnL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {navbarData.quickStats.todayPnL >= 0 ? '+' : ''}${navbarData.quickStats.todayPnL}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-400">Total Trades</p>
                          <p className="text-white font-mono">{navbarData.quickStats.totalTrades}</p>
                        </div>
                        <div>
                          <p className="text-gray-400">Market</p>
                          <p className={`font-medium ${navbarData.systemStatus.marketOpen ? 'text-green-400' : 'text-red-400'}`}>
                            {navbarData.systemStatus.marketOpen ? 'Open' : 'Closed'}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Menu Items */}
                  <div className="py-2">
                    {profileMenuItems.map((item, index) => (
                      <button
                        key={index}
                        onClick={item.onClick}
                        className={`w-full flex items-center space-x-3 px-4 py-2 text-sm hover:bg-slate-700 transition-colors ${
                          item.className || 'text-gray-300 hover:text-white'
                        }`}
                      >
                        <item.icon className="h-4 w-4" />
                        <span>{item.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={toggleMobileMenu}
              className="md:hidden p-2 text-gray-400 hover:text-gray-200 transition-colors rounded-lg hover:bg-slate-700"
            >
              {isMobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden" ref={mobileMenuRef}>
          <div className="px-2 pt-2 pb-3 space-y-1 bg-slate-800 border-t border-slate-700">
            {/* Mobile Quick Stats */}
            {navbarData && (
              <div className="px-3 py-2 bg-slate-700 rounded-lg mb-2">
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <p className="text-gray-400">Balance</p>
                    <p className="text-white font-mono">${navbarData.quickStats.balance.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-gray-400">Today P&L</p>
                    <p className={`font-mono ${navbarData.quickStats.todayPnL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {navbarData.quickStats.todayPnL >= 0 ? '+' : ''}${navbarData.quickStats.todayPnL}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {navigationItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`flex items-center space-x-3 px-3 py-2 rounded-lg text-base font-medium transition-colors ${
                    isActive
                      ? 'bg-green-600 text-white'
                      : 'text-gray-300 hover:text-white hover:bg-slate-700'
                  }`}
                >
                  <item.icon className={`h-5 w-5 ${isActive ? 'text-white' : 'text-gray-400'}`} />
                  <div>
                    <span>{item.name}</span>
                    <p className="text-xs text-gray-400">{item.description}</p>
                  </div>
                </Link>
              );
            })}
            
            {/* Mobile Connection Status */}
            <div className="px-3 py-2">
              <div className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium ${
                connected 
                  ? 'bg-green-900/30 text-green-400' 
                  : 'bg-red-900/30 text-red-400'
              }`}>
                {connected ? (
                  <Wifi className="h-4 w-4" />
                ) : (
                  <WifiOff className="h-4 w-4" />
                )}
                <span>Connection: {connected ? 'Live' : 'Offline'}</span>
                {navbarData && <span>({navbarData.systemStatus.activeUsers} users)</span>}
              </div>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
