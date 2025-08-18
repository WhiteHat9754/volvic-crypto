import { MongoClient } from 'mongodb';
import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable inside .env.local');
}

// MongoDB connection for direct queries
let client: MongoClient;
let clientPromise: Promise<MongoClient>;

if (process.env.NODE_ENV === 'development') {
  if (!(global as any)._mongoClientPromise) {
    client = new MongoClient(MONGODB_URI);
    (global as any)._mongoClientPromise = client.connect();
  }
  clientPromise = (global as any)._mongoClientPromise;
} else {
  client = new MongoClient(MONGODB_URI);
  clientPromise = client.connect();
}

// Mongoose connection
const connectDB = async () => {
  try {
    const { connection } = await mongoose.connect(MONGODB_URI);
    
    if (connection.readyState === 1) {
      console.log('MongoDB Connected Successfully');
      return Promise.resolve(true);
    }
  } catch (error) {
    console.error('MongoDB connection error:', error);
    return Promise.reject(error);
  }
};

export { clientPromise, connectDB };
