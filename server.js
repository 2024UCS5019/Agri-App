require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const validator = require('validator');
const path = require('node:path');
const crypto = require('node:crypto');
const { seedDefaultAccounts, findUserByEmail, findUserById, createUser } = require('./database');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_agri_jwt_token_2055';
const BCRYPT_SALT_ROUNDS = parseInt(process.env.BCRYPT_SALT_ROUNDS || '12', 10);
const COOKIE_NAME = process.env.SESSION_COOKIE_NAME || 'agri_auth_token';

// Pre-computed dummy hash to prevent timing attacks on non-existent email lookups
let DUMMY_HASH = '';
bcrypt.hash('dummy_pass_timing_shield', BCRYPT_SALT_ROUNDS).then(h => {
  DUMMY_HASH = h;
});

// ═══════════════════════════════════════════════════════════
//  SECURITY MIDDLEWARE (STEP 2)
// ═══════════════════════════════════════════════════════════
// Helmet: HTTP Security Headers
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com", "https://fonts.googleapis.com"],
        imgSrc: ["'self'", "data:"],
        connectSrc: ["'self'"]
      }
    }
  })
);

app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '10kb' })); // Restrict payload size
app.use(cookieParser());

// Rate Limiter: General API Protection
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  message: { error: 'Too many requests from this IP. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false
});
app.use('/api/', globalLimiter);

// Rate Limiter: Strict Brute-Force Protection for Login (Step 4)
const authLoginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Max 5 login attempts
  message: { error: 'Too many failed login attempts. Account temporarily locked for 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false
});

// ═══════════════════════════════════════════════════════════
//  AUTHENTICATION MIDDLEWARE
// ═══════════════════════════════════════════════════════════
function authenticateToken(req, res, next) {
  // Check HttpOnly Cookie first, then Authorization Header
  const token = req.cookies[COOKIE_NAME] || (req.headers.authorization && req.headers.authorization.split(' ')[1]);

  if (!token) {
    return res.status(401).json({ error: 'Unauthorized: No session token provided' });
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).json({ error: 'Unauthorized: Invalid or expired session' });
    }
    const user = findUserById(decoded.id);
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized: User no longer exists' });
    }
    req.user = user;
    next();
  });
}

// ═══════════════════════════════════════════════════════════
//  STEP 3: SIGNUP FLOW
// ═══════════════════════════════════════════════════════════
app.post('/api/auth/signup', async (req, res) => {
  try {
    const rawName = req.body.name || '';
    const rawEmail = req.body.email || '';
    const rawPassword = req.body.password || '';
    const rawRole = req.body.role || 'Owner';

    // 1. Sanitization & Normalization
    const name = validator.trim(validator.escape(rawName));
    const email = validator.normalizeEmail(validator.trim(rawEmail), { gmail_remove_dots: false }) || '';
    const role = ['Owner', 'Driver'].includes(rawRole) ? rawRole : 'Owner';

    // 2. Client & Server Input Validation
    if (!name || name.length < 2) {
      return res.status(400).json({ error: 'Full name must be at least 2 characters.' });
    }
    if (!email || !validator.isEmail(email)) {
      return res.status(400).json({ error: 'Please enter a valid email address.' });
    }
    if (!rawPassword || rawPassword.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters long.' });
    }

    // 3. Database Check (Ensure Unique Email)
    const existingUser = findUserByEmail(email);
    if (existingUser) {
      return res.status(409).json({ error: 'An account with this email already exists. Please log in.' });
    }

    // 4. Password Hashing (bcrypt cost factor 12)
    const passwordHash = await bcrypt.hash(rawPassword, BCRYPT_SALT_ROUNDS);

    // 5. Database Storage
    createUser({
      email,
      passwordHash,
      name,
      role,
      phone: req.body.phone || '+91 98765 43210'
    });

    // 6. Return Success Response (Do not auto-log in immediately)
    return res.status(201).json({
      success: true,
      message: 'Account registered successfully. Please log in with your credentials.',
      email: email,
      name: name
    });
  } catch (error) {
    console.error('Signup error:', error);
    return res.status(500).json({ error: 'Internal server error during registration.' });
  }
});

// ═══════════════════════════════════════════════════════════
//  STEP 4: LOGIN FLOW
// ═══════════════════════════════════════════════════════════
app.post('/api/auth/login', authLoginLimiter, async (req, res) => {
  try {
    const rawEmail = req.body.email || '';
    const rawPassword = req.body.password || '';

    // 1. Input Sanitization
    const email = validator.normalizeEmail(validator.trim(rawEmail), { gmail_remove_dots: false }) || '';
    if (!email || !rawPassword) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    // 2. Database Lookup
    const user = findUserByEmail(email);

    // 3. Timing Attack Shield: If user does not exist, run dummy compare
    if (!user) {
      if (DUMMY_HASH) {
        await bcrypt.compare(rawPassword, DUMMY_HASH);
      }
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    // 4. Password Verification
    const passwordMatch = await bcrypt.compare(rawPassword, user.password_hash);
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    // 5. Session Creation (Signed JWT & HttpOnly Secure Cookie)
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.cookie(COOKIE_NAME, token, {
      httpOnly: true, // Prevents XSS cookie theft
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    return res.json({
      success: true,
      message: 'Login successful.',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        phone: user.phone
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Internal server error during authentication.' });
  }
});

// ═══════════════════════════════════════════════════════════
//  GOOGLE OAUTH / SIGN-IN FLOW
// ═══════════════════════════════════════════════════════════
app.post('/api/auth/google', async (req, res) => {
  try {
    const rawEmail = req.body.email || '';
    const rawName = req.body.name || 'Google User';
    const email = validator.normalizeEmail(validator.trim(rawEmail), { gmail_remove_dots: false }) || '';
    const name = validator.trim(validator.escape(rawName)) || 'Google User';

    if (!email || !validator.isEmail(email)) {
      return res.status(400).json({ error: 'Valid Google email is required.' });
    }

    // Check if user already exists in SQLite
    let user = findUserByEmail(email);

    if (!user) {
      // Auto-provision Google account into SQLite database
      const randomPasswordHash = await bcrypt.hash(crypto.randomUUID(), 10);
      createUser({
        email,
        passwordHash: randomPasswordHash,
        name,
        role: 'Owner',
        phone: '+91 98765 43210'
      });
      user = findUserByEmail(email);
    }

    // Sign JWT and set secure HttpOnly cookie
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.cookie(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    return res.json({
      success: true,
      message: 'Google authentication successful.',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        phone: user.phone
      }
    });
  } catch (error) {
    console.error('Google auth error:', error);
    return res.status(500).json({ error: 'Internal server error during Google authentication.' });
  }
});

// ═══════════════════════════════════════════════════════════
//  SESSION VERIFICATION & LOGOUT
// ═══════════════════════════════════════════════════════════
app.get('/api/auth/me', authenticateToken, (req, res) => {
  res.json({
    authenticated: true,
    user: req.user
  });
});

app.post('/api/auth/logout', (req, res) => {
  res.clearCookie(COOKIE_NAME, {
    httpOnly: true,
    sameSite: 'lax'
  });
  res.json({ success: true, message: 'Logged out successfully.' });
});

// ═══════════════════════════════════════════════════════════
//  STATIC ASSET SERVING
// ═══════════════════════════════════════════════════════════
app.use(express.static(path.join(__dirname), {
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.js') || filePath.endsWith('.html') || filePath.endsWith('.css')) {
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    }
  }
}));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// ═══════════════════════════════════════════════════════════
//  START SERVER
// ═══════════════════════════════════════════════════════════
seedDefaultAccounts().then(() => {
  app.listen(PORT, () => {
    console.log(`\n════════════════════════════════════════════════════════════════════`);
    console.log(`🛡️  Agri-App Enterprise Auth Server Running on http://localhost:${PORT}`);
    console.log(`🔒 Security Stack: Helmet + Bcrypt (12 rounds) + JWT HttpOnly Cookie`);
    console.log(`⚡ Database: SQLite3 Users Table with Unique Email Index`);
    console.log(`════════════════════════════════════════════════════════════════════\n`);
  });
});
