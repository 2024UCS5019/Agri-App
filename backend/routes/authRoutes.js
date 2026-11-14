const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const validator = require('validator');
const User = require('../models/User');
const authMiddleware = require('../middleware/auth');
const { getConnectionStatus } = require('../config/db');

const JWT_SECRET = process.env.JWT_SECRET || 'agri_super_secret_jwt_key_2060_enterprise_secure_token_9918237';

// In-memory fallback registry if Atlas connection is still provisioning
const inMemoryUsers = new Map();

// Helper to sign JWT
const signToken = (payload) => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
};

// Helper to set cookie
const setAuthCookie = (res, token) => {
  res.cookie('agri_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  });
};

/* ── POST /api/auth/signup ── */
router.post('/signup', async (req, res) => {
  try {
    const { name, email, password, role, phone, tractorModel } = req.body;

    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Please enter your full name.' });
    }

    if (!email || !validator.isEmail(email)) {
      return res.status(400).json({ success: false, message: 'Please provide a valid email address.' });
    }

    if (!password || password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanName = name.trim();
    const dbStatus = getConnectionStatus();

    // 1. If MongoDB Atlas is connected:
    if (dbStatus.connected) {
      const existingUser = await User.findOne({ email: cleanEmail });
      if (existingUser) {
        return res.status(400).json({ success: false, message: 'An account with this email already exists.' });
      }

      const user = new User({
        name: cleanName,
        email: cleanEmail,
        password, // Handled by pre('save') bcrypt hook
        role: role || 'Driver',
        phone: phone || '+91 98765 43210',
        tractorModel: tractorModel || 'Mahindra 575 DI Sarpanch'
      });

      await user.save();

      // For security, do not log in automatically on registration. User must authenticate via sign-in.
      return res.status(201).json({
        success: true,
        message: 'Account created successfully! Please sign in with your credentials.',
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          phone: user.phone,
          tractorModel: user.tractorModel,
          licenseNumber: user.licenseNumber
        }
      });
    }

    // 2. In-memory fallback
    if (inMemoryUsers.has(cleanEmail)) {
      return res.status(400).json({ success: false, message: 'An account with this email already exists.' });
    }

    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(password, salt);

    const fallbackUser = {
      id: `usr_${Date.now()}`,
      name: cleanName,
      email: cleanEmail,
      passwordHash,
      role: role || 'Driver',
      phone: phone || '+91 98765 43210',
      tractorModel: tractorModel || 'Mahindra 575 DI Sarpanch',
      licenseNumber: 'TN-28-2022-0098234',
      createdAt: new Date()
    };

    inMemoryUsers.set(cleanEmail, fallbackUser);

    // For security, do not set auth cookie on registration. Require user sign-in.
    return res.status(201).json({
      success: true,
      message: 'Account created successfully! Please sign in with your credentials.',
      user: {
        id: fallbackUser.id,
        name: fallbackUser.name,
        email: fallbackUser.email,
        role: fallbackUser.role,
        phone: fallbackUser.phone,
        tractorModel: fallbackUser.tractorModel,
        licenseNumber: fallbackUser.licenseNumber
      }
    });
  } catch (err) {
    console.error('Signup error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error during registration.' });
  }
});

/* ── POST /api/auth/login ── */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const dbStatus = getConnectionStatus();

    // Constant-time dummy hash comparison against timing attacks
    const dummyHash = '$2a$12$e8q4w2p9XyT3u6r1s8k2veQx4m7l0y3z6b8d9g1h2j3k4l5m6n7o8';

    // 1. If MongoDB Atlas is connected
    if (dbStatus.connected) {
      const user = await User.findOne({ email: cleanEmail });
      if (!user) {
        await bcrypt.compare(password, dummyHash);
        return res.status(401).json({ success: false, message: 'Invalid email or password.' });
      }

      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        return res.status(401).json({ success: false, message: 'Invalid email or password.' });
      }

      const token = signToken({ id: user._id, email: user.email, name: user.name, role: user.role });
      setAuthCookie(res, token);

      return res.json({
        success: true,
        message: 'Authentication successful!',
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          phone: user.phone,
          tractorModel: user.tractorModel,
          licenseNumber: user.licenseNumber
        }
      });
    }

    // 2. In-memory fallback
    const user = inMemoryUsers.get(cleanEmail);
    if (!user) {
      await bcrypt.compare(password, dummyHash);
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    const token = signToken({ id: user.id, email: user.email, name: user.name, role: user.role });
    setAuthCookie(res, token);

    return res.json({
      success: true,
      message: 'Authentication successful!',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        tractorModel: user.tractorModel,
        licenseNumber: user.licenseNumber
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error during login.' });
  }
});

/* ── POST /api/auth/google ── */
router.post('/google', async (req, res) => {
  try {
    const { name, email } = req.body;

    if (!email || !validator.isEmail(email)) {
      return res.status(400).json({ success: false, message: 'Valid Google email is required.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanName = (name && name.trim()) || cleanEmail.split('@')[0];
    const dbStatus = getConnectionStatus();

    let userPayload;

    if (dbStatus.connected) {
      let user = await User.findOne({ email: cleanEmail });
      if (!user) {
        user = new User({
          name: cleanName,
          email: cleanEmail,
          password: `g_oauth_${Date.now()}_${Math.random()}`,
          role: 'Owner',
          phone: '+91 94433 88123'
        });
        await user.save();
      }

      userPayload = {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        tractorModel: user.tractorModel,
        licenseNumber: user.licenseNumber
      };
    } else {
      let user = inMemoryUsers.get(cleanEmail);
      if (!user) {
        user = {
          id: `usr_${Date.now()}`,
          name: cleanName,
          email: cleanEmail,
          role: 'Owner',
          phone: '+91 94433 88123',
          tractorModel: 'Mahindra 575 DI Sarpanch',
          licenseNumber: 'TN-28-2022-0098234'
        };
        inMemoryUsers.set(cleanEmail, user);
      }

      userPayload = user;
    }

    const token = signToken({ id: userPayload.id, email: userPayload.email, name: userPayload.name, role: userPayload.role });
    setAuthCookie(res, token);

    return res.json({
      success: true,
      message: `Google authenticated as ${cleanName}!`,
      token,
      user: userPayload
    });
  } catch (err) {
    console.error('Google OAuth error:', err);
    return res.status(500).json({ success: false, message: 'Failed to process Google authentication.' });
  }
});

/* ── GET /api/auth/me ── */
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const dbStatus = getConnectionStatus();
    if (dbStatus.connected) {
      const user = await User.findById(req.user.id).select('-password');
      if (user) {
        return res.json({ success: true, user });
      }
    }

    // Fallback lookup
    const inMem = inMemoryUsers.get(req.user.email);
    if (inMem) {
      const { passwordHash, ...safeUser } = inMem;
      return res.json({ success: true, user: safeUser });
    }

    return res.json({ success: true, user: req.user });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Error retrieving profile.' });
  }
});

/* ── PUT /api/auth/profile ── */
router.put('/profile', authMiddleware, async (req, res) => {
  try {
    const { name, phone, tractorModel, licenseNumber } = req.body;
    const dbStatus = getConnectionStatus();

    if (dbStatus.connected) {
      const user = await User.findById(req.user.id);
      if (user) {
        if (name) user.name = name.trim();
        if (phone) user.phone = phone.trim();
        if (tractorModel) user.tractorModel = tractorModel.trim();
        if (licenseNumber) user.licenseNumber = licenseNumber.trim();
        await user.save();

        return res.json({
          success: true,
          message: 'Profile updated in MongoDB Atlas!',
          user: {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            phone: user.phone,
            tractorModel: user.tractorModel,
            licenseNumber: user.licenseNumber
          }
        });
      }
    }

    const inMem = inMemoryUsers.get(req.user.email);
    if (inMem) {
      if (name) inMem.name = name.trim();
      if (phone) inMem.phone = phone.trim();
      if (tractorModel) inMem.tractorModel = tractorModel.trim();
      if (licenseNumber) inMem.licenseNumber = licenseNumber.trim();
      inMemoryUsers.set(req.user.email, inMem);

      return res.json({
        success: true,
        message: 'Profile updated successfully!',
        user: inMem
      });
    }

    return res.json({ success: true, message: 'Profile updated.', user: { ...req.user, name, phone, tractorModel, licenseNumber } });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to update profile.' });
  }
});

/* ── POST /api/auth/logout ── */
router.post('/logout', (req, res) => {
  res.clearCookie('agri_token', {
    httpOnly: true,
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
  });
  return res.json({ success: true, message: 'Logged out successfully.' });
});

module.exports = router;
