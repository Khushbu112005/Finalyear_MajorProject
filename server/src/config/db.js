const mongoose = require("mongoose");

const connectDB = async () => {
    try {
        console.log("Connecting to MongoDB database...");
        
        // Timeout in 4 seconds if unreachable
        const mongoUri = process.env.MONGODB_URI?.trim().replace(/^['"]|['"]$/g, "");
        if (!mongoUri) throw new Error("MONGODB_URI is not set");
        await mongoose.connect(mongoUri, {
            serverSelectionTimeoutMS: 4000
        });

        console.log("MongoDB connected successfully");
        global.useDbFallback = false;
    } catch (error) {
        console.warn("==================================================");
        console.warn("WARNING: MongoDB Atlas connection failed.");
        console.warn("Reason:", error.message);
        console.warn("Activating Local JSON Database Fallback Mode.");
        console.warn("==================================================");
        global.useDbFallback = true;
    }
};

module.exports = connectDB;
