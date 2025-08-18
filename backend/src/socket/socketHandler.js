const jwt = require('jsonwebtoken');
const Portfolio = require('../models/Portfolio');
const Trade = require('../models/Trade');

class SocketHandler {
  constructor(io) {
    this.io = io;
    this.setupSocketServer();
  }

  setupSocketServer() {
    // Setup authentication middleware
    this.io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token;
        console.log('Socket auth attempt:', token ? '✅ Token present' : '❌ No token');
        
        if (!token) {
          return next(new Error('No token provided'));
        }
        
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        socket.userId = decoded.userId || decoded.id;
        socket.userEmail = decoded.email;
        
        console.log(`✅ Socket authenticated: ${socket.userId}`);
        next();
      } catch (error) {
        console.error('❌ Socket auth failed:', error.message);
        next(new Error('Authentication failed'));
      }
    });

    // Handle connections
    this.io.on('connection', (socket) => {
      console.log(`✅ User connected: ${socket.id} | UserID: ${socket.userId}`);
      
      // Join user to personal room
      socket.join(`user_${socket.userId}`);
      
      // Send connection confirmation
      socket.emit('connectionConfirmed', {
        message: 'Connected to real-time trading platform',
        userId: socket.userId,
        timestamp: new Date().toISOString()
      });

      // Send initial navbar data
      this.sendNavbarData(socket);

      // Handle navbar update requests
      socket.on('requestNavbarUpdate', () => {
        this.sendNavbarData(socket);
      });

      // Handle stock subscriptions
      socket.on('subscribe', (symbol) => {
        if (symbol) {
          socket.join(symbol.toUpperCase());
          console.log(`📈 User ${socket.userId} subscribed to ${symbol}`);
        }
      });

      socket.on('unsubscribe', (symbol) => {
        if (symbol) {
          socket.leave(symbol.toUpperCase());
          console.log(`📉 User ${socket.userId} unsubscribed from ${symbol}`);
        }
      });

      // Handle disconnect
      socket.on('disconnect', (reason) => {
        console.log(`❌ User disconnected: ${socket.id} | Reason: ${reason}`);
        if (socket.navbarInterval) {
          clearInterval(socket.navbarInterval);
        }
      });

      // Setup periodic navbar updates
      socket.navbarInterval = setInterval(() => {
        this.sendNavbarData(socket);
      }, 30000);
    });

    console.log('✅ Socket server initialized');
  }

  async sendNavbarData(socket) {
    try {
      const portfolio = await Portfolio.findOne({ userId: socket.userId });
      const trades = await Trade.find({ user: socket.userId })
        .sort({ createdAt: -1 })
        .limit(3)
        .lean();

      const navbarData = {
        user: {
          id: socket.userId,
          email: socket.userEmail,
          connectionTime: new Date().toISOString()
        },
        quickStats: {
          balance: portfolio?.cashBalance || 0,
          todayPnL: portfolio?.totalPnL || 0,
          totalTrades: trades.length,
          lastTradeTime: trades[0]?.createdAt || null
        },
        notifications: {
          unread: 2,
          latest: [
            {
              id: 1,
              message: "Portfolio updated successfully",
              time: new Date().toISOString(),
              type: "success"
            },
            {
              id: 2,
              message: "Market data refreshed",
              time: new Date().toISOString(),
              type: "info"
            }
          ]
        },
        systemStatus: {
          marketOpen: this.isMarketOpen(),
          serverLoad: this.getServerLoad(),
          activeUsers: this.io.engine.clientsCount
        }
      };

      socket.emit('navbarData', navbarData);
      console.log(`📊 Navbar data sent to user ${socket.userId}`);
    } catch (error) {
      console.error('Error sending navbar data:', error);
      socket.emit('navbarError', { message: 'Failed to load navbar data' });
    }
  }

  isMarketOpen() {
    const now = new Date();
    const hour = now.getHours();
    const day = now.getDay();
    return day >= 1 && day <= 5 && hour >= 9 && hour <= 16;
  }

  getServerLoad() {
    const connections = this.io.engine.clientsCount;
    if (connections < 10) return 'low';
    if (connections < 50) return 'medium';
    return 'high';
  }

  cleanup() {
    console.log('✅ Socket services cleaned up');
  }
}

module.exports = SocketHandler;
