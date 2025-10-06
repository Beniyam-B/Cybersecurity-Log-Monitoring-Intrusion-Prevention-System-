// Import required modules for authentication functionality
const jwt = require('jsonwebtoken') // JSON Web Token for secure authentication
const { validationResult } = require('express-validator') // Request validation middleware
const { StatusCodes } = require('http-status-codes') // HTTP status codes for consistent responses
const User = require('../models/User') // User model for database operations
const UserActivity = require('../models/UserActivity')
const Log = require('../models/Log')
const { getClientIp, lookupGeo } = require('../../utils/network')
const notificationService = require('../services/notificationService') // Email/SMS notifications
const intrusionDetectionService = require('../services/intrusionDetectionService') // Security threat detection

// Helper function to create JWT tokens for authenticated users
function signToken(user) {
  // Create token payload with user identification and role
  const payload = { id: user._id, email: user.email, role: user.role }
  // Get JWT secret from environment variables or use development default
  const secret = process.env.JWT_SECRET || 'dev_secret_change_me'

  // Get token expiration time from environment or default to 7 days
  const expiresIn = process.env.JWT_EXPIRES_IN || '7d'
  
  // Sign and return the JWT token
  return jwt.sign(payload, secret, { expiresIn })
}

// User registration endpoint - creates new user accounts
exports.signup = async (req, res, next) => {
  try {
    // Validate request data using express-validator
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(StatusCodes.BAD_REQUEST).json({ errors: errors.array() })
    }

    // Extract user data from request body
    const { name, email, password, adminSecret } = req.body
    const clientIp = getClientIp(req)
    
    // Check if user with this email already exists
    const exists = await User.findOne({ email })
    if (exists) {
      return res.status(StatusCodes.CONFLICT).json({ message: 'Email already in use' })
    }

    // Determine user role - check for admin secret code
    let role = 'user'
    const validAdminSecret = process.env.ADMIN_SIGNUP_SECRET || 'CYBER_ADMIN_SECRET_2024'
    
    console.log('Admin secret check:', {
      provided: adminSecret,
      expected: validAdminSecret,
      match: adminSecret === validAdminSecret
    })
    
    if (adminSecret && adminSecret === validAdminSecret) {
      role = 'admin'
      console.log('Admin role assigned via secret code')
    } else if (email.includes('admin')) {
      // Fallback: admin emails get admin role
      role = 'admin'
      console.log('Admin role assigned via email pattern')
    }
    
    console.log('Final role assigned:', role)

    // Create new user in database
    const user = await User.create({ name, email, password, role })
    
    // Log user registration activity
    const geo = await lookupGeo(clientIp)
    await UserActivity.create({
      user: user._id,
      activityType: 'profile_update',
      description: 'User account created',
      ipAddress: clientIp,
      userAgent: req.get('User-Agent'),
      location: geo,
      status: 'success',
      riskLevel: 'low'
    }).catch(() => {})
    
    // Generate JWT token for the new user
    const token = signToken(user)
    
    // Set httpOnly cookie for secure token storage
    const cookieOptions = {
      httpOnly: true,
      secure: false, // Set to false for development (localhost)
      sameSite: 'lax', // Changed from 'strict' to 'lax' for better compatibility
      maxAge: 24 * 60 * 60 * 1000, // 24 hours for signup
      path: '/'
    }
    res.cookie('auth_token', token, cookieOptions)
    
    // Set user data cookie (not httpOnly so frontend can read it)
    res.cookie('auth_user', JSON.stringify({
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role
    }), {
      ...cookieOptions,
      httpOnly: false
    })
    
    // Send notification to admins about new user signup
    if (role === 'user') { // Only notify for regular users, not admin signups
      const admins = await User.find({ role: 'admin' }).select('email')
      const adminEmails = admins.map(admin => admin.email)
      
      if (adminEmails.length > 0) {
        await notificationService.notifyAdminNewSignup({
          email: user.email,
          name: user.name,
          role: user.role,
          ipAddress: clientIp
        }, adminEmails).catch(err => {
          console.error('Failed to send admin notification:', err)
        })
      }
    }
    
    // Send successful response with token and user data
    res
      .status(StatusCodes.CREATED)
      .json({ token, user: { id: user._id, name: user.name, email: user.email, role: user.role } })
  } catch (err) {
    // Pass error to error handling middleware
    next(err)
  }
}

// User login endpoint - authenticates existing users
exports.login = async (req, res, next) => {
  try {
    // Validate request data using express-validator
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(StatusCodes.BAD_REQUEST).json({ errors: errors.array() })
    }
    
    // Extract login credentials from request body
    const { email, password } = req.body
    const clientIp = getClientIp(req)
    const userAgent = req.get('User-Agent')
    
    // Check if IP is blocked before processing login
    const isBlocked = await intrusionDetectionService.isIPBlocked(clientIp)
    if (isBlocked) {
      return res.status(StatusCodes.FORBIDDEN).json({ 
        message: 'Access denied. Your IP address has been blocked due to suspicious activity.' 
      })
    }
    
    // Find user by email address
    const user = await User.findOne({ email })
    const geo = await lookupGeo(clientIp)

    if (!user) {
      // Log failed login attempt (unknown user)
      await UserActivity.create({
        user: undefined,
        activityType: 'login',
        description: 'Failed login - unknown user',
        ipAddress: clientIp,
        userAgent,
        location: geo,
        status: 'failed',
        riskLevel: 'medium',
        metadata: { emailAttempted: email }
      }).catch(() => {})
      
      // Analyze for brute force attack
      try {
        await intrusionDetectionService.analyzeLoginAttempt(clientIp, email, false, {
          userAgent,
          timestamp: new Date()
        })
      } catch (error) {
        console.error('Error analyzing login attempt:', error)
      }
      
      return res.status(StatusCodes.UNAUTHORIZED).json({ message: 'Invalid credentials' })
    }
    
    // Check if user account is suspended
    if (user.isSuspended) {
      return res.status(StatusCodes.FORBIDDEN).json({ message: 'Account suspended' })
    }
    
    // Check if account is locked
    if (user.isLocked()) {
      return res.status(StatusCodes.FORBIDDEN).json({ 
        message: 'Account temporarily locked due to multiple failed login attempts. Please try again later.' 
      })
    }
    
    // Verify password using bcrypt comparison
    const valid = await user.comparePassword(password)
    if (!valid) {
      // Increment failed attempts on user
      await user.incrementFailedLogins()
      
      // Log failed login for this user
      await UserActivity.create({
        user: user._id,
        activityType: 'login',
        description: 'Failed login - wrong password',
        ipAddress: clientIp,
        userAgent,
        location: geo,
        status: 'failed',
        riskLevel: 'high'
      }).catch(() => {})
      
      // Create a security alert log
      await Log.create({
        user: user._id,
        action: 'Failed Login',
        ip: clientIp,
        severity: 'Medium',
        status: 'Active',
        meta: { reason: 'invalid_password' }
      }).catch(() => {})
      
      // Analyze for brute force attack
      try {
        await intrusionDetectionService.analyzeLoginAttempt(clientIp, email, false, {
          userAgent,
          timestamp: new Date(),
          userId: user._id
        })
      } catch (error) {
        console.error('Error analyzing failed login attempt:', error)
      }
      
      return res.status(StatusCodes.UNAUTHORIZED).json({ message: 'Invalid credentials' })
    }
    
    // Generate JWT token for authenticated user
    const token = signToken(user)

    // Reset failed attempts and set lastLogin
    await user.resetFailedLogins()

    // Log successful login
    await UserActivity.create({
      user: user._id,
      activityType: 'login',
      description: 'Successful login',
      ipAddress: clientIp,
      userAgent,
      location: geo,
      status: 'success',
      riskLevel: 'low'
    }).catch(() => {})
    
    // Analyze successful login (resets brute force counters)
    try {
      await intrusionDetectionService.analyzeLoginAttempt(clientIp, email, true, {
        userAgent,
        timestamp: new Date(),
        userId: user._id
      })
    } catch (error) {
      console.error('Error analyzing successful login:', error)
    }
    
    // Send login notification to user
    try {
      await notificationService.notifyUserLogin(user, {
        ipAddress: clientIp,
        location: geo?.city ? `${geo.city}, ${geo.country}` : 'Unknown',
        userAgent: userAgent
      })
    } catch (err) {
      console.error('Failed to send login notification:', err)
    }
    
    // Set httpOnly cookie for secure token storage
    res.cookie('auth_token', token, {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/'
    })
    
    // Set user data cookie (readable by frontend)
    res.cookie('auth_user', JSON.stringify({
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      profilePicture: user.profilePicture
    }), {
      secure: false,
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/'
    })
    
    // Send successful response with token and user data
    res.status(StatusCodes.OK).json({ 
      token, 
      user: { 
        id: user._id, 
        name: user.name, 
        email: user.email, 
        role: user.role, 
        profilePicture: user.profilePicture 
      } 
    })
  } catch (err) {
    // Pass error to error handling middleware
    next(err)
  }
}

// Get current user profile endpoint - returns authenticated user's information
exports.me = async (req, res, next) => {
  try {
    // Find current user by ID from JWT token (exclude password for security)
    const user = await User.findById(req.user.id).select('-password')
    
    // Send user data in response
    res.json({ user })
  } catch (err) {
    // Pass error to error handling middleware
    next(err)
  }
}

// Optional logout endpoint to record session end and clear cookies
exports.logout = async (req, res, next) => {
  try {
    const userId = req.user?.id
    if (userId) {
      const clientIp = (req.headers['x-forwarded-for'] || '').toString().split(',')[0] || req.ip
      await UserActivity.create({
        user: userId,
        activityType: 'logout',
        description: 'User logged out',
        ipAddress: clientIp,
        userAgent: req.get('User-Agent'),
        status: 'success'
      }).catch(() => {})
    }
    
    // Clear httpOnly cookies
    res.clearCookie('auth_token', {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      path: '/'
    })
    
    res.clearCookie('auth_user', {
      secure: false,
      sameSite: 'lax',
      path: '/'
    })
    
    res.json({ success: true })
  } catch (err) {
    next(err)
  }
}

// Hidden admin login method - not visible to regular users
// This method allows admins to login using a special admin code in addition to credentials
exports.adminLogin = async (req, res, next) => {
  try {
    // Validate request data using express-validator
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(StatusCodes.BAD_REQUEST).json({ errors: errors.array() })
    }
    
    // Extract admin credentials and secret code from request body
    const { email, password, adminCode } = req.body
    
    // Verify admin code against environment variable or default value
    const validAdminCode = process.env.ADMIN_SECRET_CODE || 'CYBER_ADMIN_2024'
    if (!adminCode || adminCode !== validAdminCode) {
      return res.status(StatusCodes.UNAUTHORIZED).json({ message: 'Invalid credentials' })
    }
    
    // Find user by email address
    const user = await User.findOne({ email })
    if (!user) {
      return res.status(StatusCodes.UNAUTHORIZED).json({ message: 'Invalid credentials' })
    }
    
    // Check if user account is suspended
    if (user.isSuspended) {
      return res.status(StatusCodes.FORBIDDEN).json({ message: 'Account suspended' })
    }
    
    // Verify password using bcrypt comparison
    const valid = await user.comparePassword(password)
    if (!valid) {
      return res.status(StatusCodes.UNAUTHORIZED).json({ message: 'Invalid credentials' })
    }
    
    // Ensure user has admin role privileges
    if (user.role !== 'admin') {
      return res.status(StatusCodes.FORBIDDEN).json({ message: 'Access denied' })
    }
    
    // Generate JWT token for authenticated admin user
    const token = signToken(user)
    
    // Set httpOnly cookie for secure token storage
    const cookieOptions = {
      httpOnly: true,
      secure: false, // Set to false for development (localhost)
      sameSite: 'lax', // Changed from 'strict' to 'lax' for better compatibility
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      path: '/'
    }
    res.cookie('auth_token', token, cookieOptions)
    
    // Set user data cookie (not httpOnly so frontend can read it)
    res.cookie('auth_user', JSON.stringify({
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role
    }), {
      ...cookieOptions,
      httpOnly: false
    })
    
    // Update user's last login timestamp
    user.lastLogin = new Date()
    await user.save()
    
    // Send successful response with token and admin user data
    res.status(StatusCodes.OK).json({ 
      token, 
      user: { 
        id: user._id, 
        name: user.name, 
        email: user.email, 
        role: user.role 
      } 
    })
    
  } catch (err) {
    // Pass error to error handling middleware
    next(err)
  }
}

