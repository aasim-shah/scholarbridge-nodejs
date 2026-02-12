import mongoose from "mongoose";

export async function connectMongo() {
  const uri = process.env.MONGODB_URI || "mongodb://localhost:27017/scholarhub";
  
  mongoose.set('strictQuery', false);
  
  // Production-ready connection options
  const options = {
    maxPoolSize: 10, // Maximum number of connections in the pool
    minPoolSize: 2,  // Minimum number of connections
    serverSelectionTimeoutMS: 5000, // Timeout for server selection
    socketTimeoutMS: 45000, // Socket timeout
    retryWrites: true,
    retryReads: true,
  };
  
  await mongoose.connect(uri, options);
  
  // Handle connection events
  mongoose.connection.on('error', (err) => {
    console.error('[MongoDB] Connection error:', err);
  });
  
  mongoose.connection.on('disconnected', () => {
    console.warn('[MongoDB] Disconnected from database');
  });
  
  mongoose.connection.on('reconnected', () => {
    console.log('[MongoDB] Reconnected to database');
  });
  
  return mongoose.connection;
}

export async function disconnectMongo() {
  await mongoose.connection.close();
  console.log('[MongoDB] Connection closed');
}
