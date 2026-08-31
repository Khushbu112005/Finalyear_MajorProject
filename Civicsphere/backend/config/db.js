import mongoose from 'mongoose';

/**
 * Connect to MongoDB database
 */
const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/civicsphere';
    const conn = await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of hanging indefinitely
    });

    console.log(`[MongoDB] Connected successfully: ${conn.connection.host}`);
    return true;
  } catch (error) {
    console.error(`[MongoDB Connection Warning]: ${error.message}`);
    console.log('[MongoDB] Running in offline/development mode if MongoDB is not running locally.');
    return false;
  }
};

export default connectDB;
