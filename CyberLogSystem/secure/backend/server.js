// Import required Node.js modules and third-party packages
const express = require('express') // Web framework for Node.js
const cors = require('cors') // Cross-Origin Resource Sharing middleware
const helmet = require('helmet') // Security headers middleware
const morgan = require('morgan') // HTTP request logger middleware
const cookieParser = require('cookie-parser') // Cookie parsing middleware
const dotenv = require('dotenv') // Environment variables loader
const mongoSanitize = require('express-mongo-sanitize') // MongoDB query sanitization
const xss = require('xss-clean') // Cross-site scripting protection

// Load environment variables from .env file
dotenv.config()

// Import database connection function
const { connectDB } = require('./src/config/db')

// Import custom middleware
const errorHandler = require('./src/middleware/errorHandler') // Global error handling middleware
const apiLimiter = require('./src/middleware/rateLimiter') // Rate limiting middleware
const { intrusionDetectionMiddleware } = require('./src/middleware/intrusionDetectionMiddleware') // Intrusion detection

// Import route modules
const authRoutes = require('./src/routes/authRoutes') // Authentication routes (login, signup, admin)
const logRoutes = require('./src/routes/logRoutes') // Log management routes
const adminRoutes = require('./src/routes/adminRoutes') // Admin-specific routes
const dashboardRoutes = require('./src/routes/dashboardRoutes') // Dashboard analytics routes
const profileRoutes = require('./src/routes/profileRoutes') // User profile management routes
const reportRoutes = require('./src/routes/reportRoutes') // PDF report generation routes

// Create Express application instance
const app = express()

// Configure security headers using Helmet
// frameguard prevents clickjacking attacks by denying frame embedding
app.use(helmet.frameguard({ action: "deny" }));

// Configure CORS - Allow all origins temporarily
app.use(
  cors({
    origin: true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
  })
)

// Configure request parsing middleware
app.use(express.json({ limit: '1mb' })) // Parse JSON requests with size limit
app.use(express.urlencoded({ extended: true })) // Parse URL-encoded requests
app.use(cookieParser()) // Parse cookies from requests

// Configure security middleware
app.use(mongoSanitize()) // Sanitize MongoDB queries to prevent NoSQL injection
app.use(xss()) // Clean user input to prevent cross-site scripting attacks

// Configure logging middleware (only in non-test environments)
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev')) // Log HTTP requests in development format
}

// Apply intrusion detection middleware to all routes
app.use(intrusionDetectionMiddleware)

// Health check endpoint for monitoring and load balancers
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'CyberLogSystem API' })
})

// Apply rate limiting to all API routes (after intrusion detection)
app.use('/api', apiLimiter)

// Mount API route modules
app.use('/api/auth', authRoutes) // Authentication endpoints
app.use('/api/logs', logRoutes) // Log management endpoints
app.use('/api/admin', adminRoutes) // Admin-only endpoints
app.use('/api/dashboard', dashboardRoutes) // Dashboard analytics endpoints
app.use('/api/profile', profileRoutes) // User profile endpoints
app.use('/api/reports', reportRoutes) // PDF report generation endpoints

// Global error handling middleware (must be last)
app.use(errorHandler)

// Get port from environment variables or use default
let port = process.env.PORT || 8080

// Function to find available port
function findAvailablePort(startPort) {
  return new Promise((resolve) => {
    const server = require('net').createServer()
    server.listen(startPort, () => {
      const availablePort = server.address().port
      server.close(() => resolve(availablePort))
    })
    server.on('error', () => {
      resolve(findAvailablePort(startPort + 1))
    })
  })
}

// Connect to MongoDB database and start the server
connectDB()
  .then(async () => {
    // Find available port if default is in use
    if (!process.env.PORT) {
      port = await findAvailablePort(8080)
    }
    
    // Database connection successful, start HTTP server
    app.listen(port, () => {
      console.log(`\n🚀 CyberLogSystem API listening on port ${port}`)
      console.log(`📊 Health check: http://localhost:${port}/api/health`)
      console.log(`🌐 Frontend should use: http://localhost:${port}/api\n`)
    })
  })
  .catch((err) => {
    // Database connection failed, log error and exit
    console.error('Failed to connect to DB:', err)
    process.exit(1)
  })

// Export app for testing purposes
module.exports = app

