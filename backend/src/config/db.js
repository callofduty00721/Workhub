import mongoose from "mongoose";
import { logger } from "../utils/logger.js";

export const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      // Without an explicit cap, the driver's default (100) can let a burst
      // of slow queries open far more sockets than a single small instance
      // (or MongoDB Atlas's own connection limit) can actually sustain.
      maxPoolSize: Number(process.env.MONGO_MAX_POOL_SIZE) || 20,
      minPoolSize: Number(process.env.MONGO_MIN_POOL_SIZE) || 2,
      // How long to wait for a server to become available before failing a
      // request outright — without this, the driver's own default (30s) lets
      // requests hang far longer than any reasonable HTTP client will wait.
      serverSelectionTimeoutMS: Number(process.env.MONGO_SERVER_SELECTION_TIMEOUT_MS) || 10000,
      // How long an individual socket may sit idle mid-operation before
      // Mongoose kills it — catches a stalled query instead of leaving the
      // request (and the connection it's holding) hanging indefinitely.
      socketTimeoutMS: Number(process.env.MONGO_SOCKET_TIMEOUT_MS) || 45000,
    });
    logger.info(`MongoDB connected: ${conn.connection.host}`);
  } catch (error) {
    logger.error(`MongoDB connection error: ${error.message}`);
    process.exit(1);
  }
};
