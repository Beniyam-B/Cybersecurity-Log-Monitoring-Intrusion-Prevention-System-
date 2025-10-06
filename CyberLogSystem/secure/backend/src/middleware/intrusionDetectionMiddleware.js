/**
 * Intrusion Detection Middleware - Analyzes incoming requests for security threats
 * This middleware runs on every request to detect and prevent malicious activities
 */

const intrusionDetectionService = require('../services/intrusionDetectionService')
const { StatusCodes } = require('http-status-codes')

/**
 * Middleware to check if IP is blocked
 * This runs first to immediately reject blocked IPs
 */
const checkBlockedIP = async (req, res, next) => {
  try {
    // Skip IP check for health endpoint
    if (req.path === '/api/health') {
      return next()
    }
    
    const clientIP = intrusionDetectionService.getClientIP(req)
    
    // Check if IP is blocked
    const isBlocked = await intrusionDetectionService.isIPBlocked(clientIP)
    
    if (isBlocked) {
      // Log the blocked attempt
      console.log(`Blocked IP ${clientIP} attempted to access ${req.method} ${req.path}`)
      
      return res.status(StatusCodes.FORBIDDEN).json({
        message: 'Access denied. Your IP address has been blocked due to suspicious activity.',
        code: 'IP_BLOCKED'
      })
    }
    
    next()
  } catch (error) {
    console.error('Error in IP blocking middleware:', error)
    // Don't block request if there's an error checking
    next()
  }
}

/**
 * Middleware to analyze HTTP requests for threats
 * This analyzes request patterns and content for malicious activity
 */
const analyzeRequest = async (req, res, next) => {
  try {
    // Skip analysis for certain endpoints to avoid false positives
    const skipPaths = ['/api/health', '/api/auth/login', '/api/auth/signup']
    if (skipPaths.includes(req.path)) {
      return next()
    }
    
    // Analyze the request for threats
    const analysis = await intrusionDetectionService.analyzeHttpRequest(req)
    
    if (analysis && analysis.threat) {
      console.log(`Threat detected from ${intrusionDetectionService.getClientIP(req)}: ${analysis.intrusionType}`)
      
      // For high severity threats, block the request
      if (analysis.severity === 'High' || analysis.severity === 'Critical') {
        return res.status(StatusCodes.FORBIDDEN).json({
          message: 'Request blocked due to security threat detection.',
          code: 'THREAT_DETECTED',
          threatType: analysis.intrusionType
        })
      }
      
      // For medium/low severity, log but allow request to continue
      // The threat has already been logged by the detection service
    }
    
    next()
  } catch (error) {
    console.error('Error in request analysis middleware:', error)
    // Don't block request if there's an error analyzing
    next()
  }
}

/**
 * Middleware to track request patterns for DDoS detection
 * This monitors request frequency from individual IPs
 */
const trackRequestPatterns = (() => {
  // In-memory store for request tracking (in production, use Redis)
  const requestCounts = new Map()
  const REQUEST_WINDOW = 60 * 1000 // 1 minute window
  const MAX_REQUESTS_PER_MINUTE = 100 // Max requests per IP per minute
  
  return (req, res, next) => {
    try {
      const clientIP = intrusionDetectionService.getClientIP(req)
      const now = Date.now()
      
      // Clean up old entries
      for (const [ip, data] of requestCounts.entries()) {
        if (now - data.firstRequest > REQUEST_WINDOW) {
          requestCounts.delete(ip)
        }
      }
      
      // Track current request
      if (!requestCounts.has(clientIP)) {
        requestCounts.set(clientIP, {
          count: 1,
          firstRequest: now
        })
      } else {
        const data = requestCounts.get(clientIP)
        data.count++
        
        // Check if exceeding rate limit
        if (data.count > MAX_REQUESTS_PER_MINUTE) {
          console.log(`Rate limit exceeded for IP ${clientIP}: ${data.count} requests in ${REQUEST_WINDOW/1000}s`)
          
          // This could trigger automatic IP blocking for severe cases
          if (data.count > MAX_REQUESTS_PER_MINUTE * 2) {
            // Auto-block IP for excessive requests
            intrusionDetectionService.analyzeHttpRequest(req).catch(console.error)
          }
          
          return res.status(StatusCodes.TOO_MANY_REQUESTS).json({
            message: 'Too many requests. Please slow down.',
            code: 'RATE_LIMIT_EXCEEDED'
          })
        }
      }
      
      next()
    } catch (error) {
      console.error('Error in request pattern tracking:', error)
      next()
    }
  }
})()

/**
 * Combined intrusion detection middleware
 * This combines all detection mechanisms into a single middleware
 */
const intrusionDetectionMiddleware = [
  checkBlockedIP,      // First: Check if IP is blocked
  trackRequestPatterns, // Second: Track request patterns
  analyzeRequest       // Third: Analyze request content
]

module.exports = {
  checkBlockedIP,
  analyzeRequest,
  trackRequestPatterns,
  intrusionDetectionMiddleware
}