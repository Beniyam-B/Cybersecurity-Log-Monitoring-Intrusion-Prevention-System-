const User = require('../models/User')

// Middleware to check if user has admin privileges
const isAdmin = async (req, res, next) => {
  try {
    // Check if user exists and has admin role
    const user = await User.findById(req.user.id)
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found'
      })
    }
    
    // Check if user is admin
    if (user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.'
      })
    }
    
    // Check if admin account is suspended
    if (user.isSuspended) {
      return res.status(403).json({
        success: false,
        message: 'Admin account is suspended'
      })
    }
    
    // Add user info to request for use in controllers
    req.adminUser = user
    next()
    
  } catch (error) {
    console.error('Admin middleware error:', error)
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    })
  }
}

module.exports = { isAdmin }




