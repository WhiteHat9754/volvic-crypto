'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';

// Define interfaces for the data
interface NavbarData {
  user: {
    id: string;
    email: string;
    connectionTime: string;
  };
  quickStats: {
    balance: number;
    todayPnL: number;
    totalTrades: number;
    lastTradeTime: string | null;
  };
  notifications: {
    unread: number;
    latest: Array<{
      id: number;
      message: string;
      time: string;
      type: 'success' | 'info' | 'warning' | 'error';
    }>;
  };
  systemStatus: {
    marketOpen: boolean;
    serverLoad: 'low' | 'medium' | 'high';
    activeUsers: number;
  };
}

interface PriceUpdate {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  timestamp: string;
  volume: number;
}

interface PortfolioData {
  totalBalance: number;
  totalPnL: number;
  stocks: any[];
  lastUpdated: string;
}

interface SocketContextType {
  socket: Socket | null;
  connected: boolean;
  // Data states
  navbarData: NavbarData | null;
  priceData: Record<string, PriceUpdate>;
  portfolioData: PortfolioData | null;
  // Functions
  requestNavbarUpdate: () => void;
  subscribeTo: (symbol: string) => void;
  unsubscribeFrom: (symbol: string) => void;
  // Loading states
  isLoadingNavbar: boolean;
  isLoadingPortfolio: boolean;
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  connected: false,
  navbarData: null,
  priceData: {},
  portfolioData: null,
  requestNavbarUpdate: () => {},
  subscribeTo: () => {},
  unsubscribeFrom: () => {},
  isLoadingNavbar: true,
  isLoadingPortfolio: true,
});

interface SocketProviderProps {
  children: ReactNode;
}

export const SocketProvider: React.FC<SocketProviderProps> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const { user } = useAuth();

  // Data states
  const [navbarData, setNavbarData] = useState<NavbarData | null>(null);
  const [priceData, setPriceData] = useState<Record<string, PriceUpdate>>({});
  const [portfolioData, setPortfolioData] = useState<PortfolioData | null>(null);
  
  // Loading states
  const [isLoadingNavbar, setIsLoadingNavbar] = useState(true);
  const [isLoadingPortfolio, setIsLoadingPortfolio] = useState(true);

  // Get token from cookies
  const getAuthToken = () => {
    if (typeof document !== 'undefined') {
      const tokenFromCookie = document.cookie
        .split('; ')
        .find(row => row.startsWith('token='))
        ?.split('=')[1];
      return tokenFromCookie;
    }
    return null;
  };

  // Request navbar update
  const requestNavbarUpdate = () => {
    if (socket && connected) {
      socket.emit('requestNavbarUpdate');
      console.log('🔄 Navbar update requested');
    }
  };

  // Subscribe to stock symbol
  const subscribeTo = (symbol: string) => {
    if (socket && connected) {
      socket.emit('subscribe', symbol);
      console.log(`📈 Subscribed to ${symbol}`);
    }
  };

  // Unsubscribe from stock symbol
  const unsubscribeFrom = (symbol: string) => {
    if (socket && connected) {
      socket.emit('unsubscribe', symbol);
      console.log(`📉 Unsubscribed from ${symbol}`);
    }
  };

  useEffect(() => {
    if (user) {
      const token = getAuthToken();
      
      if (token) {
        
        const newSocket = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5000', {
          auth: { token },
          transports: ['websocket', 'polling'],
          timeout: 10000,
          reconnection: true,
          reconnectionAttempts: 5,
          reconnectionDelay: 1000
        });

        newSocket.on('connect', () => {
          // console.log('✅ Connected to server');
          setConnected(true);
        });

        newSocket.on('disconnect', (reason) => {
          // console.log('❌ Disconnected from server:', reason);
          setConnected(false);
        });

        newSocket.on('connect_error', (error) => {
          // console.error('🔥 Connection error:', error);
          setConnected(false);
        });

        // Handle connection confirmation
        newSocket.on('connectionConfirmed', (data) => {
          // console.log('✅ Connection confirmed:', data.message);
        });

        // Handle navbar data
        newSocket.on('navbarData', (data: NavbarData) => {
          // console.log('📊 Navbar data received:', data);
          setNavbarData(data);
          setIsLoadingNavbar(false);
        });

        // Handle navbar updates
        newSocket.on('navbarUpdate', (update: any) => {
          // console.log('🔄 Navbar update received:', update);
          
          setNavbarData(prev => {
            if (!prev) return prev;
            
            return {
              ...prev,
              quickStats: {
                ...prev.quickStats,
                balance: update.newBalance || prev.quickStats.balance,
                todayPnL: update.newPnL || prev.quickStats.todayPnL,
                totalTrades: prev.quickStats.totalTrades + (update.type === 'tradeExecuted' ? 1 : 0),
                lastTradeTime: update.type === 'tradeExecuted' ? update.timestamp : prev.quickStats.lastTradeTime
              }
            };
          });
        });

        // Handle navbar errors
        newSocket.on('navbarError', (error) => {
          console.error('❌ Navbar error:', error);
          setIsLoadingNavbar(false);
        });

        // Handle real-time price updates
        newSocket.on('priceUpdate', (data: PriceUpdate) => {
          console.log('📈 Price update received:', data);
          setPriceData(prev => ({
            ...prev,
            [data.symbol]: data
          }));
        });

        // Handle portfolio updates
        newSocket.on('portfolioUpdate', (data: PortfolioData) => {
          console.log('💼 Portfolio update received:', data);
          setPortfolioData(data);
          setIsLoadingPortfolio(false);
        });

        // Handle system status updates
        newSocket.on('systemStatus', (status) => {
          console.log('🖥️ System status:', status);
          
          setNavbarData(prev => {
            if (!prev) return prev;
            
            return {
              ...prev,
              systemStatus: {
                ...prev.systemStatus,
                activeUsers: status.activeUsers || prev.systemStatus.activeUsers,
                marketOpen: status.marketStatus === 'open'
              }
            };
          });
        });

        setSocket(newSocket);

        return () => {
          console.log('🔌 Cleaning up socket connection');
          newSocket.close();
        };
      } else {
        console.warn('⚠️ No auth token found, cannot connect to socket');
        setIsLoadingNavbar(false);
        setIsLoadingPortfolio(false);
      }
    } else {
      // Clean up socket if user logs out
      if (socket) {
        console.log('👤 User logged out, cleaning up socket');
        socket.close();
        setSocket(null);
        setConnected(false);
        setNavbarData(null);
        setPriceData({});
        setPortfolioData(null);
        setIsLoadingNavbar(true);
        setIsLoadingPortfolio(true);
      }
    }
  }, [user]);

  const value = {
    socket,
    connected,
    // Data
    navbarData,
    priceData,
    portfolioData,
    // Functions
    requestNavbarUpdate,
    subscribeTo,
    unsubscribeFrom,
    // Loading states
    isLoadingNavbar,
    isLoadingPortfolio,
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};

export { SocketContext };

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (context === undefined) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

// Export individual hooks for specific data
export const useNavbarData = () => {
  const { navbarData, isLoadingNavbar, requestNavbarUpdate } = useSocket();
  return { navbarData, isLoadingNavbar, requestNavbarUpdate };
};

export const usePriceData = () => {
  const { priceData, subscribeTo, unsubscribeFrom } = useSocket();
  return { priceData, subscribeTo, unsubscribeFrom };
};

export const usePortfolioData = () => {
  const { portfolioData, isLoadingPortfolio } = useSocket();
  return { portfolioData, isLoadingPortfolio };
};
