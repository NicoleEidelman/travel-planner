import mongoose from 'mongoose';
// Connect to MongoDB using Mongoose
export async function connectDB(uri) {
  mongoose.set('strictQuery', true);
  await mongoose.connect(uri, { dbName: 'travel_planner' });
  console.log('[DB] connected');
}
// This file is part of the server configuration for the Travel Planner MVP application.

