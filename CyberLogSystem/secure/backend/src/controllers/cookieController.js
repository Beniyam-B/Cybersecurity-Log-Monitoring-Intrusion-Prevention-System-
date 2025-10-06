/**
 * Cookie Controller - Manages httpOnly cookies for JWT tokens
 * Provides secure token storage using httpOnly cookies to prevent XSS attacks
 */

const jwt = require('jsonwebtoken')

class CookieController {
  /**
   * Set httpOnly cookie with JWT token
   * POST /api/auth/set-cookie
   */
  async setCookie(req, res) {
    try {
      const { token, user, persistent = false } = req.body

      if (!token || !user) {
        return res.status(400).json({
          success: false,
          message: 'Token and user data are required'
        })
      }

      // Verify token is valid
      try {
        jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key')
      } catch (error) {
        return res.status(400).json({
          success: false,
          message: 'Invalid token'
        })
      }

      // Cookie options for security
      const cookieOptions = {
        httpOnly: true,        // Prevent XSS attacks
        secure: process.env.NODE_ENV === 'production', // HTTPS only in production
        sameSite: 'strict',    // CSRF protection
        maxAge: persistent ? 30 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000, // 30 days or 24 hours
        path: '/'              // Available for all routes
      }

      // Set the httpOnly cookie
      res.cookie('auth_token', token, cookieOptions)
      
      // Also set user data in a separate cookie (not httpOnly since frontend needs to read it)
      res.cookie('auth_user', JSON.stringify(user), {
        ...cookieOptions,
        httpOnly: false // Frontend can read user data
      })

      res.json({
        success: true,
        message: 'Cookie set successfully',
        user
      })

    } catch (error) {
      console.error('Error setting cookie:', error)
      res.status(500).json({
        success: false,
        message: 'Failed to set cookie',
        error: error.message
      })
    }
  }

  /**
   * Clear httpOnly cookies
   * POST /api/auth/clear-cookie
   */
  async clearCookie(req, res) {
    try {
      // Clear both cookies
      res.clearCookie('auth_token', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/'
      })
      
      res.clearCookie('auth_user', {
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/'
      })

      res.json({
        success: true,
        message: 'Cookies cleared successfully'
      })

    } catch (error) {
      console.error('Error clearing cookies:', error)
      res.status(500).json({
        success: false,
        message: 'Failed to clear cookies',
        error: error.message
      })
    }
  }

  /**
   * Test cookie support
   * GET /api/auth/test-cookie
   */
  async testCookie(req, res) {
    try {
      // Check if cookies are supported by checking for existing auth cookie
      const token = req.cookies?.auth_token
      
      res.json({
        success: true,
        cookieSupported: true,
        hasAuthCookie: !!token,
        message: 'Cookie support test successful'
      })

    } catch (error) {
      console.error('Error testing cookies:', error)
      res.status(500).json({
        success: false,
        cookieSupported: false,
        message: 'Cookie test failed',
        error: error.message
      })
    }
  }
}

module.exports = new CookieController()