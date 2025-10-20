import mongoose from "mongoose";

// Recommended flags for modern Mongoose
mongoose.set("strictQuery", true);

let isConnected = false;

export const connectDB = async () => {
  // If already connected, reuse
  if (mongoose.connection.readyState === 1) {
    isConnected = true;
    // console.log("🟢 Using existing MongoDB connection");
    return;
  }

  // If previous flag says connected but connection is not ready, reset flag
  if (isConnected && mongoose.connection.readyState !== 1) {
    isConnected = false;
  }

  if (!process.env.MONGO_URI) {
    throw new Error("❌ MONGO_URI not found in environment variables");
  }

  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      // Modern connection options
      serverSelectionTimeoutMS: 60000, // 60s to handle serverless cold starts
      socketTimeoutMS: 75000, // 75s socket timeout
      connectTimeoutMS: 60000, // 60s connection timeout
      bufferCommands: false, // disable buffering to fail fast instead of timeout
      maxPoolSize: 10, // limit connection pool for serverless
      family: 4, // prefer IPv4 to avoid some IPv6 DNS issues on serverless
    });

    isConnected = true;
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error("❌ MongoDB connection error:", error.message);
    // Bubble up the original error to help diagnose on platform logs
    throw error;
  }
};
