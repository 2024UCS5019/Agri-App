const mongoose = require('mongoose');
const dns = require('dns');

// Use public DNS (Google 8.8.8.8 and Cloudflare 1.1.1.1) to resolve Atlas SRV records on local Windows ISPs
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch {
  // fallback to system DNS
}

let isConnected = false;
let connectionError = null;

const connectDB = async () => {
  const uri = process.env.MONGODB_URI;

  if (!uri || uri.includes('<password>')) {
    console.warn('\n⚠️ [MongoDB Atlas] MONGODB_URI is not configured in .env.');
    console.warn('ℹ️  Add your MongoDB Atlas connection string to backend/.env:');
    console.warn('   MONGODB_URI=mongodb+srv://<user>:<password>@cluster0.mongodb.net/agri_app\n');
    connectionError = 'URI not configured or contains placeholder';
    return false;
  }

  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000, // Timeout fast if Atlas cluster is unreachable
    });

    isConnected = true;
    connectionError = null;
    console.log(`\n🍃 [MongoDB Atlas] Connected successfully to host: ${conn.connection.host}`);
    console.log(`📦 [MongoDB Atlas] Database Name: ${conn.connection.name}\n`);
    return true;
  } catch (err) {
    isConnected = false;
    connectionError = err.message;
    console.warn(`\n⚠️ [MongoDB Atlas] Connection failed: ${err.message}`);
    console.warn('ℹ️  Operating with intelligent hybrid storage until Atlas cluster is reached.\n');
    return false;
  }
};

const getConnectionStatus = () => ({
  connected: isConnected,
  readyState: mongoose.connection.readyState,
  error: connectionError,
  host: mongoose.connection.host || null,
  database: mongoose.connection.name || null
});

module.exports = { connectDB, getConnectionStatus };
