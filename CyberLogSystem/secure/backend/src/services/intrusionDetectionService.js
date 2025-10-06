/**
 * Intrusion Detection Service - Analyzes patterns and detects security threats
 * This service implements rule-based and pattern-matching intrusion detection
 */

const IntrusionEvent = require('../models/IntrusionEvent')
const BlockedIP = require('../models/BlockedIP')
const UserActivity = require('../models/UserActivity')
const Log = require('../models/Log')
const notificationService = require('./notificationService')

class IntrusionDetectionService {
  constructor() {
    // Define detection rules and thresholds
    this.detectionRules = {
      // Brute force attack detection
      bruteForce: {
        maxFailedAttempts: 5,        // Max failed logins before triggering
        timeWindow: 15 * 60 * 1000,  // 15 minutes window
        blockDuration: 60            // Block for 60 minutes
      },
      
      // Suspicious activity patterns
      suspiciousActivity: {
        maxRequestsPerMinute: 100,   // Max requests per minute from single IP
        maxLoginAttemptsPerHour: 20, // Max login attempts per hour
        timeWindow: 60 * 60 * 1000   // 1 hour window
      },
      
      // DDoS detection
      ddosDetection: {
        maxRequestsPerSecond: 50,    // Max requests per second
        minSourceIPs: 10,            // Minimum different IPs for DDoS classification
        timeWindow: 60 * 1000        // 1 minute window
      }
    }
  }

  /**
   * Analyze login attempt for brute force patterns
   * @param {string} ipAddress - Source IP address
   * @param {string} email - Email being attempted
   * @param {boolean} success - Whether login was successful
   * @param {Object} requestDetails - Additional request information
   * @returns {Promise} Analysis result and actions taken
   */
  async analyzeLoginAttempt(ipAddress, email, success, requestDetails = {}) {
    try {
      // If login was successful, reset any failed attempt counters
      if (success) {
        await this.resetFailedAttempts(ipAddress)
        return { threat: false, action: 'none' }
      }

      // Count recent failed attempts from this IP
      const recentFailures = await this.countRecentFailedLogins(ipAddress)
      
      // Check if this exceeds brute force threshold
      if (recentFailures >= this.detectionRules.bruteForce.maxFailedAttempts) {
        // Create intrusion event
        const intrusionEvent = await IntrusionEvent.create({
          sourceIp: ipAddress,
          targetResource: '/auth/login',
          intrusionType: 'brute_force',
          severity: 'High',
          status: 'Active',
          description: `Brute force attack detected: ${recentFailures} failed login attempts`,
          requestDetails: requestDetails,
          responseAction: 'ip_blocked',
          isBlocked: true,
          repeatCount: recentFailures
        })

        // Block the IP address
        await BlockedIP.blockIP(ipAddress, 'brute_force_attack', {
          duration: this.detectionRules.bruteForce.blockDuration,
          notes: `Blocked due to ${recentFailures} failed login attempts`
        })

        // Create security log
        await Log.create({
          user: null,
          action: 'Brute Force Attack Blocked',
          ip: ipAddress,
          severity: 'High',
          status: 'Blocked',
          meta: { 
            failedAttempts: recentFailures,
            targetEmail: email,
            intrusionEventId: intrusionEvent._id
          }
        })

        // Send alert to administrators
        await this.sendSecurityAlert({
          type: 'Brute Force Attack',
          severity: 'High',
          sourceIp: ipAddress,
          description: `IP ${ipAddress} blocked after ${recentFailures} failed login attempts`,
          timestamp: new Date()
        })

        return {
          threat: true,
          action: 'ip_blocked',
          intrusionEventId: intrusionEvent._id,
          message: 'IP address blocked due to brute force attack'
        }
      }

      return { threat: false, action: 'monitored' }
    } catch (error) {
      console.error('Error analyzing login attempt:', error)
      return { threat: false, action: 'error', error: error.message }
    }
  }

  /**
   * Analyze HTTP request for suspicious patterns
   * @param {Object} req - Express request object
   * @returns {Promise} Analysis result
   */
  async analyzeHttpRequest(req) {
    try {
      const ipAddress = this.getClientIP(req)
      const userAgent = req.get('User-Agent') || ''
      const url = req.originalUrl || req.url
      const method = req.method

      // Check for SQL injection patterns
      const sqlInjectionPatterns = [
        /(\bUNION\b.*\bSELECT\b)/i,
        /(\bSELECT\b.*\bFROM\b)/i,
        /(\bINSERT\b.*\bINTO\b)/i,
        /(\bDROP\b.*\bTABLE\b)/i,
        /(\bDELETE\b.*\bFROM\b)/i,
        /(\'.*OR.*\'.*=.*\')/i,
        /(\".*OR.*\".*=.*\")/i
      ]

      // Check for XSS patterns
      const xssPatterns = [
        /<script[^>]*>.*<\/script>/i,
        /javascript:/i,
        /on\w+\s*=/i,
        /<iframe[^>]*>/i,
        /<object[^>]*>/i
      ]

      const requestString = JSON.stringify({
        url: url,
        query: req.query,
        body: req.body,
        headers: req.headers
      })

      let threatDetected = false
      let intrusionType = null
      let severity = 'Medium'

      // Check for SQL injection
      for (const pattern of sqlInjectionPatterns) {
        if (pattern.test(requestString)) {
          threatDetected = true
          intrusionType = 'sql_injection'
          severity = 'High'
          break
        }
      }

      // Check for XSS if no SQL injection found
      if (!threatDetected) {
        for (const pattern of xssPatterns) {
          if (pattern.test(requestString)) {
            threatDetected = true
            intrusionType = 'xss_attack'
            severity = 'Medium'
            break
          }
        }
      }

      // If threat detected, create intrusion event
      if (threatDetected) {
        const intrusionEvent = await IntrusionEvent.create({
          sourceIp: ipAddress,
          targetResource: url,
          intrusionType: intrusionType,
          severity: severity,
          status: 'Active',
          description: `${intrusionType.replace('_', ' ').toUpperCase()} attempt detected in ${method} request to ${url}`,
          requestDetails: {
            method: method,
            url: url,
            userAgent: userAgent,
            headers: req.headers,
            query: req.query,
            body: req.body
          },
          responseAction: 'alert_sent'
        })

        // Create security log
        await Log.create({
          user: req.user?.id || null,
          action: `${intrusionType.replace('_', ' ').toUpperCase()} Attempt`,
          ip: ipAddress,
          severity: severity,
          status: 'Active',
          meta: {
            url: url,
            method: method,
            intrusionEventId: intrusionEvent._id
          }
        })

        // Send security alert
        await this.sendSecurityAlert({
          type: intrusionType.replace('_', ' ').toUpperCase(),
          severity: severity,
          sourceIp: ipAddress,
          description: `${intrusionType.replace('_', ' ').toUpperCase()} attempt from ${ipAddress} on ${url}`,
          timestamp: new Date()
        })

        return {
          threat: true,
          intrusionType: intrusionType,
          severity: severity,
          intrusionEventId: intrusionEvent._id
        }
      }

      return { threat: false }
    } catch (error) {
      console.error('Error analyzing HTTP request:', error)
      return { threat: false, error: error.message }
    }
  }

  /**
   * Check if IP address is currently blocked
   * @param {string} ipAddress - IP address to check
   * @returns {Promise<boolean>} True if IP is blocked
   */
  async isIPBlocked(ipAddress) {
    try {
      return await BlockedIP.isBlocked(ipAddress)
    } catch (error) {
      console.error('Error checking blocked IP:', error)
      return false // Default to not blocked if error
    }
  }

  /**
   * Count recent failed login attempts from an IP
   * @param {string} ipAddress - IP address to check
   * @returns {Promise<number>} Number of recent failed attempts
   */
  async countRecentFailedLogins(ipAddress) {
    try {
      const timeWindow = new Date(Date.now() - this.detectionRules.bruteForce.timeWindow)
      
      return await UserActivity.countDocuments({
        activityType: 'login',
        status: 'failed',
        ipAddress: ipAddress,
        createdAt: { $gte: timeWindow }
      })
    } catch (error) {
      console.error('Error counting failed logins:', error)
      return 0 // Default to 0 if error
    }
  }

  /**
   * Reset failed attempt counters for an IP (called on successful login)
   * @param {string} ipAddress - IP address to reset
   * @returns {Promise} Reset result
   */
  async resetFailedAttempts(ipAddress) {
    // This could be implemented to track and reset counters
    // For now, we rely on time-based windows
    return true
  }

  /**
   * Send security alert to administrators
   * @param {Object} alertData - Alert information
   * @returns {Promise} Alert sending result
   */
  async sendSecurityAlert(alertData) {
    try {
      // Get admin email addresses
      const User = require('../models/User')
      const admins = await User.find({ role: 'admin' }).select('email')
      const adminEmails = admins.map(admin => admin.email)

      if (adminEmails.length > 0) {
        return await notificationService.sendSecurityAlert(alertData, adminEmails)
      }

      return { success: false, message: 'No admin emails found' }
    } catch (error) {
      console.error('Error sending security alert:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Get client IP address from request
   * @param {Object} req - Express request object
   * @returns {string} Client IP address
   */
  getClientIP(req) {
    return req.headers['x-forwarded-for']?.split(',')[0] || 
           req.connection?.remoteAddress || 
           req.socket?.remoteAddress || 
           req.ip || 
           'unknown'
  }

  /**
   * Perform periodic cleanup of old intrusion events and expired blocks
   * @returns {Promise} Cleanup result
   */
  async performMaintenance() {
    try {
      // Clean up expired IP blocks
      const expiredBlocks = await BlockedIP.cleanupExpiredBlocks()
      
      // Archive old intrusion events (older than 90 days)
      const archiveDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
      const archivedEvents = await IntrusionEvent.updateMany(
        { createdAt: { $lt: archiveDate }, status: { $ne: 'Active' } },
        { $set: { status: 'Archived' } }
      )

      console.log(`Maintenance completed: ${expiredBlocks} expired blocks cleaned, ${archivedEvents.modifiedCount} events archived`)
      
      return {
        expiredBlocks,
        archivedEvents: archivedEvents.modifiedCount
      }
    } catch (error) {
      console.error('Error during maintenance:', error)
      return { error: error.message }
    }
  }
}

// Export singleton instance
module.exports = new IntrusionDetectionService()