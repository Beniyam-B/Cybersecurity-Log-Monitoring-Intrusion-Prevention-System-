const jwt = require('jsonwebtoken') // Import JWT library for token verification
const { StatusCodes } = require('http-status-codes') // Import HTTP status codes for consistent responses

// Middleware to protect routes - verifies JWT token and adds user info to request
// Priority: httpOnly cookies > Authorization header for better security
const protect = async (req, res, next) => {
  try {
    // Get token from httpOnly cookies first (most secure), then Authorization header
    const tokenFromCookie = req.cookies && req.cookies.auth_token // Get token from httpOnly cookie
    const header = req.headers.authorization || '' // Get Authorization header if present
    const tokenFromHeader = header.startsWith('Bearer ') ? header.substring(7) : null // Extract token from "Bearer <token>"
    const token = tokenFromCookie || tokenFromHeader // Prioritize cookie token over header token
    
    // Check if token exists
    if (!token) {
      return res.status(StatusCodes.UNAUTHORIZED).json({ 
        success: false,
        message: 'Access denied. No token provided.' 
      })
    }
    
    // Verify the JWT token
    const payload = jwt.verify(token, process.env.JWT_SECRET || 'dev_secret_change_me')
    
    // Add user information to request object for use in subsequent middleware/routes
    req.user = { 
      id: payload.id, // User ID from token
      role: payload.role, // User role from token
      email: payload.email // User email from token
    }
    
    // Continue to next middleware/route
    next()
    
  } catch (err) {
    // Handle JWT verification errors
    console.error('Auth middleware error:', err)
    return res.status(StatusCodes.UNAUTHORIZED).json({ 
      success: false,
      message: 'Invalid or expired token' 
    })
  }
}

// Export the protect middleware function
module.exports = { protect }








