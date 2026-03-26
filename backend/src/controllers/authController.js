import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import User from '../models/User.js';
import Token from '../models/Token.js';

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d'
  });
};

const generateRefreshTokenString = () => {
  return crypto.randomBytes(40).toString('hex');
};

const createRefreshToken = async (userId) => {
  const tokenString = generateRefreshTokenString();
  const expiresInDays = parseInt(process.env.REFRESH_EXPIRE_DAYS || '30', 10);
  const expires = new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000);

  const tokenDoc = await Token.create({
    user: userId,
    token: tokenString,
    expires
  });

  return tokenDoc;
};

// @desc    Register new user
// @route   POST /api/auth/register
// @access  Public
export const register = async (req, res) => {
  try {
    const { name, email, password, phone, address } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email'
      });
    }

    // Create user
    const user = await User.create({
      name,
      email,
      password,
      phone,
      address
    });

    // Generate token
    const token = generateToken(user._id);
    const refreshDoc = await createRefreshToken(user._id);

    // Set refresh token as HttpOnly cookie
    res.cookie('refreshToken', refreshDoc.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'Strict',
      maxAge: refreshDoc.expires ? refreshDoc.expires.getTime() - Date.now() : 30 * 24 * 60 * 60 * 1000
    });

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error registering user'
    });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password'
      });
    }

    // Find user and include password
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check password
    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Generate token
    const token = generateToken(user._id);
    const refreshDoc = await createRefreshToken(user._id);

    // Set refresh token as HttpOnly cookie
    res.cookie('refreshToken', refreshDoc.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'Strict',
      maxAge: refreshDoc.expires ? refreshDoc.expires.getTime() - Date.now() : 30 * 24 * 60 * 60 * 1000
    });

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error logging in'
    });
  }
};

// @desc    Refresh access token using refresh token cookie
// @route   POST /api/auth/refresh
// @access  Public (uses refresh cookie)
export const refreshToken = async (req, res) => {
  try {
    const refreshToken = req.cookies?.refreshToken || req.body?.refreshToken || req.headers['x-refresh-token'];

    if (!refreshToken) {
      return res.status(401).json({ success: false, message: 'No refresh token provided' });
    }

    const tokenDoc = await Token.findOne({ token: refreshToken }).populate('user');

    if (!tokenDoc || tokenDoc.revoked) {
      return res.status(401).json({ success: false, message: 'Invalid refresh token' });
    }

    if (tokenDoc.expires && tokenDoc.expires < new Date()) {
      return res.status(401).json({ success: false, message: 'Refresh token expired' });
    }

    // Optionally rotate: revoke old and issue new
    tokenDoc.revoked = true;
    await tokenDoc.save();

    const newRefreshDoc = await createRefreshToken(tokenDoc.user._id);

    // Set new refresh token cookie
    res.cookie('refreshToken', newRefreshDoc.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'Strict',
      maxAge: newRefreshDoc.expires ? newRefreshDoc.expires.getTime() - Date.now() : 30 * 24 * 60 * 60 * 1000
    });

    // Issue new access token
    const accessToken = generateToken(tokenDoc.user._id);

    res.json({ success: true, token: accessToken });
  } catch (error) {
    console.error('Refresh token error:', error);
    res.status(500).json({ success: false, message: 'Error refreshing token' });
  }
};

// @desc    Logout user (revoke refresh token)
// @route   POST /api/auth/logout
// @access  Public (uses refresh cookie)
export const logout = async (req, res) => {
  try {
    const refreshToken = req.cookies?.refreshToken || req.body?.refreshToken || req.headers['x-refresh-token'];

    if (refreshToken) {
      const tokenDoc = await Token.findOne({ token: refreshToken });
      if (tokenDoc) {
        tokenDoc.revoked = true;
        await tokenDoc.save();
      }
    }

    // Clear cookie
    res.clearCookie('refreshToken', { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'Strict' });

    res.json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ success: false, message: 'Error logging out' });
  }
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        address: user.address,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error('GetMe error:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting user data'
    });
  }
};

// @desc    Update user profile
// @route   PUT /api/auth/me
// @access  Private
export const updateProfile = async (req, res) => {
  try {
    const { name, phone, address } = req.body;

    // Find user and update allowed fields
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Update fields
    if (name) user.name = name;
    if (phone !== undefined) user.phone = phone;
    if (address !== undefined) user.address = address;

    await user.save();

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        address: user.address,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error('UpdateProfile error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error updating profile'
    });
  }
};
