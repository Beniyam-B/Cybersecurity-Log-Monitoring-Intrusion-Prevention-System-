/**
 * Notification Service - Handles email and SMS notifications for security events
 * This service manages all outbound communications including alerts, signup notifications, and reports
 */

// const nodemailer = require('nodemailer') // Temporarily disabled

class NotificationService {
  constructor() {
    // Email service temporarily disabled
    this.emailTransporter = null
    
    // SMS service configuration (example using Twilio)
    this.smsConfig = {
      accountSid: process.env.TWILIO_ACCOUNT_SID || 'your-twilio-sid',
      authToken: process.env.TWILIO_AUTH_TOKEN || 'your-twilio-token',
      fromNumber: process.env.TWILIO_FROM_NUMBER || '+1234567890'
    }
  }

  /**
   * Send email notification
   * @param {string} to - Recipient email address
   * @param {string} subject - Email subject
   * @param {string} htmlContent - HTML email content
   * @param {string} textContent - Plain text fallback
   * @returns {Promise} Email sending result
   */
  async sendEmail(to, subject, htmlContent, textContent = '') {
    try {
      // Email service temporarily disabled - log to console instead
      console.log(`\n📧 EMAIL NOTIFICATION (to: ${to}):`)
      console.log(`Subject: ${subject}`)
      console.log(`Content: ${textContent || htmlContent.replace(/<[^>]*>/g, '')}\n`)
      
      return { success: true, messageId: `console_${Date.now()}`, note: 'Email logged to console - install nodemailer for actual sending' }
    } catch (error) {
      console.error('Email logging failed:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Send SMS notification (placeholder - requires Twilio setup)
   * @param {string} to - Recipient phone number
   * @param {string} message - SMS message content
   * @returns {Promise} SMS sending result
   */
  async sendSMS(to, message) {
    try {
      // This is a placeholder implementation
      // In production, integrate with Twilio or similar SMS service
      console.log(`SMS would be sent to ${to}: ${message}`)
      
      // Simulated SMS sending
      return { 
        success: true, 
        messageId: `sms_${Date.now()}`,
        note: 'SMS service not configured - check console for message content'
      }
    } catch (error) {
      console.error('SMS sending failed:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Notify admin about new user signup
   * @param {Object} newUser - New user information
   * @param {Array} adminEmails - List of admin email addresses
   * @returns {Promise} Notification result
   */
  async notifyAdminNewSignup(newUser, adminEmails) {
    const subject = '🔔 New User Registration - CyberGuard'
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0;">🛡️ CyberGuard Security</h1>
        </div>
        <div style="padding: 20px; background: #f8f9fa;">
          <h2 style="color: #333;">New User Registration Alert</h2>
          <p>A new user has registered on the CyberGuard platform:</p>
          
          <div style="background: white; padding: 15px; border-radius: 8px; margin: 15px 0;">
            <strong>User Details:</strong><br>
            📧 Email: ${newUser.email}<br>
            👤 Name: ${newUser.name}<br>
            🔐 Role: ${newUser.role}<br>
            📅 Registration Time: ${new Date().toLocaleString()}<br>
            🌐 IP Address: ${newUser.ipAddress || 'Unknown'}
          </div>
          
          <p style="color: #666;">Please review this registration and take appropriate action if needed.</p>
          
          <div style="text-align: center; margin: 20px 0;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/dashboard" 
               style="background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
              View Admin Dashboard
            </a>
          </div>
        </div>
        <div style="background: #e9ecef; padding: 10px; text-align: center; font-size: 12px; color: #666;">
          This is an automated security notification from CyberGuard System
        </div>
      </div>
    `

    // Send notification to all admin emails
    const results = []
    for (const adminEmail of adminEmails) {
      const result = await this.sendEmail(adminEmail, subject, htmlContent)
      results.push({ email: adminEmail, ...result })
    }

    return results
  }

  /**
   * Send login notification to user
   * @param {Object} user - User information
   * @param {Object} loginDetails - Login details (IP, location, etc.)
   * @returns {Promise} Notification result
   */
  async notifyUserLogin(user, loginDetails) {
    const subject = '🔐 Security Alert: New Login to Your Account'
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0;">🛡️ CyberGuard Security</h1>
        </div>
        <div style="padding: 20px; background: #f8f9fa;">
          <h2 style="color: #333;">Login Security Notification</h2>
          <p>Hello ${user.name},</p>
          <p>We detected a new login to your CyberGuard account:</p>
          
          <div style="background: white; padding: 15px; border-radius: 8px; margin: 15px 0;">
            <strong>Login Details:</strong><br>
            🕐 Time: ${new Date().toLocaleString()}<br>
            🌐 IP Address: ${loginDetails.ipAddress}<br>
            📍 Location: ${loginDetails.location || 'Unknown'}<br>
            💻 Device: ${loginDetails.userAgent || 'Unknown'}<br>
            ✅ Status: Successful
          </div>
          
          <p>If this was you, no action is needed. If you don't recognize this login, please:</p>
          <ul>
            <li>Change your password immediately</li>
            <li>Review your account activity</li>
            <li>Contact your administrator</li>
          </ul>
          
          <div style="text-align: center; margin: 20px 0;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/profile" 
               style="background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
              Review Account Security
            </a>
          </div>
        </div>
        <div style="background: #e9ecef; padding: 10px; text-align: center; font-size: 12px; color: #666;">
          This is an automated security notification from CyberGuard System
        </div>
      </div>
    `

    // Send email notification
    const emailResult = await this.sendEmail(user.email, subject, htmlContent)
    
    // Send SMS notification if phone number is available
    let smsResult = null
    if (user.profile && user.profile.phone) {
      const smsMessage = `CyberGuard Security Alert: New login detected from ${loginDetails.ipAddress} at ${new Date().toLocaleString()}. If this wasn't you, secure your account immediately.`
      smsResult = await this.sendSMS(user.profile.phone, smsMessage)
    }

    return {
      email: emailResult,
      sms: smsResult
    }
  }
}

// Export singleton instance
module.exports = new NotificationService()