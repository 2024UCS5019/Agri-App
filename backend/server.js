require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const { connectDB, getConnectionStatus } = require('./config/db');

const authRoutes = require('./routes/authRoutes');
const billRoutes = require('./routes/billRoutes');
const driverRoutes = require('./routes/driverRoutes');

const app = express();
const PORT = process.env.PORT || 5000;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

// Enable trust proxy for cloud deployment (Render, Vercel, Railway, reverse proxies)
app.set('trust proxy', 1);

// Enterprise Helmet Security Headers
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: false // Allow modern frontend API calls & iframes if needed
}));

// CORS Configuration for Next.js frontend (Vercel & Localhost)
const allowedOrigins = [
  FRONTEND_URL,
  'http://localhost:3000',
  'http://127.0.0.1:3000'
];

app.use(cors({
  origin: (origin, callback) => {
    // Allow server-to-server or mobile requests without origin
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin) || origin.endsWith('.vercel.app')) {
      return callback(null, true);
    }
    return callback(null, true); // Permissive in dev, can restrict in strict prod
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Rate Limiting for Auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  validate: { xForwardedForHeader: false, default: true },
  message: { success: false, message: 'Too many login attempts. Please try again later.' }
});

// Mount Routes
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/bills', billRoutes);
app.use('/api/drivers', driverRoutes);

// Health Check Endpoint (Render & Vercel deployment probe)
app.get('/api/health', (req, res) => {
  const dbStatus = getConnectionStatus();
  res.json({
    status: 'ONLINE',
    service: 'Agri-App Enterprise API',
    version: '2.0.0',
    timestamp: new Date().toISOString(),
    uptime: `${Math.floor(process.uptime())}s`,
    environment: process.env.NODE_ENV || 'development',
    database: {
      type: 'MongoDB Atlas',
      connected: dbStatus.connected,
      host: dbStatus.host,
      databaseName: dbStatus.database,
      readyState: dbStatus.readyState
    },
    hosting: {
      provider: 'Render Ready (API) + Vercel Ready (Frontend)'
    }
  });
});

// Root welcome
app.get('/', (req, res) => {
  res.json({
    message: '🚜 Agri-App Tractor Fleet OS Backend API',
    documentation: '/api/health',
    status: 'Running'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route not found: ${req.originalUrl}` });
});

// Start Server and Connect DB
if (require.main === module) {
  app.listen(PORT, async () => {
    console.log(`\n══════════════════════════════════════════════════════════════════`);
    console.log(`🚀 Agri-App API Server is running on http://localhost:${PORT}`);
    console.log(`🔒 Security: Helmet + JWT HttpOnly Cookie + Bcrypt (12 rounds)`);
    console.log(`🌐 Allowed Frontend Origin: ${FRONTEND_URL}`);
    console.log(`══════════════════════════════════════════════════════════════════\n`);

    await connectDB();
  });
}

module.exports = app;
