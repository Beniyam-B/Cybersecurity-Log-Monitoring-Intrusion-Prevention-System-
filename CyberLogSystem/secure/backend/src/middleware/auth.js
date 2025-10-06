// Import required packages
const jwt = require('jsonwebtoken')          // For verifying and decoding JSON Web Tokens (JWT)
const { StatusCodes } = require('http-status-codes')  // Provides readable status codes like 401, 403

// This function returns a middleware for authentication and optional role-based authorization
function auth(requiredRole) {
  // Middleware function (Express format: req, res, next)
  return (req, res, next) => {
    try {
      // 1. Extract token from the request header or cookies
      const header = req.headers.authorization || ''  // Get "Authorization" header if available
      const tokenFromHeader = header.startsWith('Bearer ') 
        ? header.substring(7)  // Remove "Bearer " prefix and keep only the token
        : null
      const tokenFromCookie = req.cookies && req.cookies.token // Check if token exists in cookies

      // Final token (priority: header > cookie)
      const token = tokenFromHeader || tokenFromCookie

      // If no token is found, reject the request
      if (!token) {
        return res.status(StatusCodes.UNAUTHORIZED).json({ message: 'Unauthorized' })
      }

      // 2. Verify the token using JWT_SECRET (fallback: 'dev_secret_change_me' for development)
      const payload = jwt.verify(token, process.env.JWT_SECRET || 'dev_secret_change_me')

      // 3. Attach user info from the payload to the request object (so next middlewares can use it)
      req.user = { 
        id: payload.id, 
        role: payload.role, 
        email: payload.email 
      }

      // 4. Role-based authorization: if a required role is provided, check if the user has it
      if (requiredRole && payload.role !== requiredRole) {
        return res.status(StatusCodes.FORBIDDEN).json({ message: 'Forbidden' })
      }

      // 5. If everything is good, move to the next middleware or route handler
      next()
    } catch (err) {
      // If token verification fails or something goes wrong
      return res.status(StatusCodes.UNAUTHORIZED).json({ message: 'Invalid token' })
    }
  }
}

// Export the middleware so it can be used in routes
module.exports = auth
