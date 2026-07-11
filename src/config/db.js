const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // This reads the MONGO_URI from your .env file
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`✅ MongoDB Connected successfully: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ MongoDB Connection Failed: ${error.message}`);
    process.exit(1); // Shuts down the server if the database fails to connect
  }
};

module.exports = connectDB;