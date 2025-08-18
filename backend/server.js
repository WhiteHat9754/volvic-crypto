const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
require('dotenv').config();
const cookieParser = require('cookie-parser');
const MongoStockDataFetcher = require('./backgroundTasks/stockDataFetcher');
const SocketHandler = require('./src/socket/socketHandler');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Middleware
app.use(cors({
  origin: "http://localhost:3000", // Must match exactly
  credentials: true,
  methods: ["GET", "POST"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

app.use(express.json());
app.use(cookieParser());

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/trading-platform', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  maxPoolSize: 10, // Maintain up to 10 socket connections
  serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
  socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
})
.then(() => {
  console.log('✅ MongoDB connected successfully');
  
  // Start the stock data fetcher after MongoDB connection
  initializeStockDataFetcher();
})
.catch(err => {
  console.error('❌ MongoDB connection error:', err);
  process.exit(1);
});

async function initializeStockDataFetcher() {
  try {
    console.log('🚀 Initializing stock data fetcher...');
    
    const stockFetcher = new MongoStockDataFetcher();
    await stockFetcher.startFetching();
    
    console.log('✅ Stock data fetcher initialized and running');
  } catch (error) {
    console.error('❌ Error initializing stock fetcher:', error);
  }
}



// Routes
app.use('/api/auth', require('./src/routes/auth'));
app.use('/api/stocks', require('./src/routes/stocks'));
app.use('/api/trading', require('./src/routes/trading'));
app.use('/api/portfolio', require('./src/routes/portfolio'));
app.use('/api/admin', require('./src/routes/admin')); 
app.use('/api/dashboard', require('./src/routes/dashboard')); 
app.use('/api/crypto', require('./src/routes/crypto')); 

// Add health check route
app.get('/api/health', async (req, res) => {
  try {
    // Check MongoDB connection
    const mongoStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
    
    // Check stock data freshness
    const StockCache = require('./models/StockCache');
    const recentStocks = await StockCache.countDocuments({
      lastUpdated: { $gte: new Date(Date.now() - 5 * 60 * 1000) } // Last 5 minutes
    });
    
    res.json({ 
      status: 'OK',
      mongodb: mongoStatus,
      connectedUsers: io.engine.clientsCount,
      freshStocks: recentStocks,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      status: 'ERROR',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// 404 handler
// app.use('*', (req, res) => {
//   res.status(404).json({ error: 'Route not found' });
// });

// Initialize Socket Handler
const socketHandler = new SocketHandler(io);
app.set('io', io);
app.set('socketHandler', socketHandler);


const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down server...');
  
  // Cleanup socket services
  if (socketHandler) {
    socketHandler.cleanup();
  }
  
  // Close MongoDB connection
  mongoose.connection.close();
  
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});