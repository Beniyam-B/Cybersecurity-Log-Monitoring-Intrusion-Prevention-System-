/**
 * Report Service - Generates PDF reports for users and administrators
 * This service creates comprehensive security reports with charts and analytics
 */

// const puppeteer = require('puppeteer') // Temporarily disabled
const User = require('../models/User')
const Log = require('../models/Log')
const UserActivity = require('../models/UserActivity')
const IntrusionEvent = require('../models/IntrusionEvent')
const BlockedIP = require('../models/BlockedIP')

class ReportService {
  constructor() {
    this.browserInstance = null
  }

  /**
   * Initialize browser instance for PDF generation
   * @returns {Promise} Browser instance
   */
  async initBrowser() {
    throw new Error('PDF generation temporarily disabled. Please install puppeteer: npm install puppeteer')
  }

  /**
   * Close browser instance
   */
  async closeBrowser() {
    if (this.browserInstance) {
      await this.browserInstance.close()
      this.browserInstance = null
    }
  }

  /**
   * Generate user security report
   * @param {string} userId - User ID to generate report for
   * @param {string} reportType - Type of report (daily, weekly, monthly)
   * @returns {Promise<Object>} Report data
   */
  async generateUserReport(userId, reportType = 'weekly') {
    try {
      const { startDate, endDate, periodLabel } = this.getDateRange(reportType)
      const user = await User.findById(userId).select('name email')
      
      const [loginHistory, securityAlerts, activityStats] = await Promise.all([
        this.getUserLoginHistory(userId, startDate, endDate),
        this.getUserSecurityAlerts(userId, startDate, endDate),
        this.getUserActivityStats(userId, startDate, endDate)
      ])
      
      return {
        user,
        periodLabel,
        loginHistory,
        securityAlerts,
        activityStats,
        generatedAt: new Date().toISOString()
      }
    } catch (error) {
      console.error('Error generating user report:', error)
      throw error
    }
  }

  /**
   * Generate admin system report
   * @param {string} reportType - Type of report (daily, weekly, monthly)
   * @returns {Promise<Object>} Report data
   */
  async generateAdminReport(reportType = 'weekly') {
    try {
      const { startDate, endDate, periodLabel } = this.getDateRange(reportType)
      
      const [systemStats, threatAnalysis, topAlerts] = await Promise.all([
        this.getSystemStats(startDate, endDate),
        this.getThreatAnalysis(startDate, endDate),
        this.getTopSecurityAlerts(startDate, endDate)
      ])
      
      return {
        periodLabel,
        systemStats,
        threatAnalysis,
        topAlerts,
        generatedAt: new Date().toISOString()
      }
    } catch (error) {
      console.error('Error generating admin report:', error)
      throw error
    }
  }

  /**
   * Get date range based on report type
   * @param {string} reportType - Report type
   * @returns {Object} Date range and label
   */
  getDateRange(reportType) {
    const endDate = new Date()
    let startDate = new Date()
    let periodLabel = ''

    switch (reportType) {
      case 'daily':
        startDate.setDate(endDate.getDate() - 1)
        periodLabel = 'Daily Report - ' + endDate.toLocaleDateString()
        break
      case 'weekly':
        startDate.setDate(endDate.getDate() - 7)
        periodLabel = 'Weekly Report - ' + startDate.toLocaleDateString() + ' to ' + endDate.toLocaleDateString()
        break
      case 'monthly':
        startDate.setMonth(endDate.getMonth() - 1)
        periodLabel = 'Monthly Report - ' + startDate.toLocaleDateString() + ' to ' + endDate.toLocaleDateString()
        break
      default:
        startDate.setDate(endDate.getDate() - 7)
        periodLabel = 'Weekly Report'
    }

    return { startDate, endDate, periodLabel }
  }

  /**
   * Get user login history
   * @param {string} userId - User ID
   * @param {Date} startDate - Start date
   * @param {Date} endDate - End date
   * @returns {Promise<Array>} Login history
   */
  async getUserLoginHistory(userId, startDate, endDate) {
    return await UserActivity.find({
      user: userId,
      activityType: 'login',
      createdAt: { $gte: startDate, $lte: endDate }
    }).sort({ createdAt: -1 }).limit(50)
  }

  /**
   * Get user security alerts
   * @param {string} userId - User ID
   * @param {Date} startDate - Start date
   * @param {Date} endDate - End date
   * @returns {Promise<Array>} Security alerts
   */
  async getUserSecurityAlerts(userId, startDate, endDate) {
    return await Log.find({
      user: userId,
      severity: { $in: ['Medium', 'High', 'Critical'] },
      createdAt: { $gte: startDate, $lte: endDate }
    }).sort({ createdAt: -1 })
  }

  /**
   * Get user activity statistics
   * @param {string} userId - User ID
   * @param {Date} startDate - Start date
   * @param {Date} endDate - End date
   * @returns {Promise<Object>} Activity statistics
   */
  async getUserActivityStats(userId, startDate, endDate) {
    const mongoose = require('mongoose')
    const userObjectId = new mongoose.Types.ObjectId(userId)
    const last7Days = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    
    console.log('Report getUserActivityStats:', { userId, userObjectId, last7Days })
    
    // Check if any UserActivity records exist for this user
    const allUserActivities = await UserActivity.find({ user: userObjectId })
    console.log('All user activities:', allUserActivities.length)
    
    const [totalLoginAttempts, successfulLogins, failedLogins, securityScore] = await Promise.all([
      UserActivity.countDocuments({
        user: userObjectId,
        activityType: 'login',
        createdAt: { $gte: last7Days }
      }),
      UserActivity.countDocuments({
        user: userObjectId,
        activityType: 'login',
        status: 'success',
        createdAt: { $gte: last7Days }
      }),
      UserActivity.countDocuments({
        user: userObjectId,
        activityType: 'login',
        status: 'failed',
        createdAt: { $gte: last7Days }
      }),
      this.calculateUserSecurityScore(userId)
    ])
    
    console.log('Report stats:', { totalLoginAttempts, successfulLogins, failedLogins })

    return {
      totalLoginAttempts,
      successfulLogins,
      failedLogins,
      securityScore,
      successRate: totalLoginAttempts > 0 ? ((successfulLogins / totalLoginAttempts) * 100).toFixed(1) : 100
    }
  }

  /**
   * Calculate user security score
   * @param {string} userId - User ID
   * @returns {Promise<number>} Security score
   */
  async calculateUserSecurityScore(userId) {
    // This is a simplified version - you can enhance this logic
    const last30Days = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    
    const [failedLogins, securityAlerts] = await Promise.all([
      UserActivity.countDocuments({
        user: userId,
        activityType: 'login',
        status: 'failed',
        createdAt: { $gte: last30Days }
      }),
      Log.countDocuments({
        user: userId,
        severity: { $in: ['Medium', 'High', 'Critical'] },
        createdAt: { $gte: last30Days }
      })
    ])

    let score = 100
    score -= Math.min(failedLogins * 5, 20)
    score -= Math.min(securityAlerts * 3, 15)
    
    return Math.max(score, 0)
  }

  /**
   * Generate HTML content for user report
   * @param {Object} data - Report data
   * @returns {string} HTML content
   */
  generateUserReportHTML(data) {
    const { user, periodLabel, loginHistory, securityAlerts, activityStats } = data

    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>CyberGuard Security Report - ${user.name}</title>
        <style>
            body { font-family: Arial, sans-serif; margin: 0; padding: 20px; color: #333; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; margin: -20px -20px 30px -20px; }
            .header h1 { margin: 0; font-size: 28px; }
            .header p { margin: 10px 0 0 0; opacity: 0.9; }
            .section { margin-bottom: 30px; }
            .section h2 { color: #667eea; border-bottom: 2px solid #667eea; padding-bottom: 10px; }
            .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin: 20px 0; }
            .stat-card { background: #f8f9fa; padding: 20px; border-radius: 8px; text-align: center; border-left: 4px solid #667eea; }
            .stat-value { font-size: 24px; font-weight: bold; color: #667eea; }
            .stat-label { color: #666; margin-top: 5px; }
            table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            th, td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
            th { background-color: #f8f9fa; font-weight: bold; }
            .status-success { color: #28a745; font-weight: bold; }
            .status-failed { color: #dc3545; font-weight: bold; }
            .severity-high { color: #dc3545; font-weight: bold; }
            .severity-medium { color: #ffc107; font-weight: bold; }
            .severity-low { color: #28a745; font-weight: bold; }
            .footer { text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 12px; }
        </style>
    </head>
    <body>
        <div class="header">
            <h1>🛡️ CyberGuard Security Report</h1>
            <p>${periodLabel}</p>
            <p>Generated for: ${user?.name || 'User'} (${user?.email || 'N/A'})</p>
        </div>

        <div class="section">
            <h2>📊 Activity Summary</h2>
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-value">${activityStats?.totalLoginAttempts || 0}</div>
                    <div class="stat-label">Total Login Attempts</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${activityStats?.successfulLogins || 0}</div>
                    <div class="stat-label">Successful Logins</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${activityStats?.failedLogins || 0}</div>
                    <div class="stat-label">Failed Attempts</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${activityStats?.securityScore || 0}%</div>
                    <div class="stat-label">Security Score</div>
                </div>
            </div>
        </div>

        <div class="section">
            <h2>🔐 Recent Login History</h2>
            <table>
                <thead>
                    <tr>
                        <th>Date & Time</th>
                        <th>IP Address</th>
                        <th>Location</th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody>
                    ${(loginHistory || []).map(login => `
                        <tr>
                            <td>${login.createdAt ? new Date(login.createdAt).toLocaleString() : 'N/A'}</td>
                            <td>${login.ipAddress || 'Unknown'}</td>
                            <td>${login.location?.city ? `${login.location.city}, ${login.location.country}` : 'Unknown'}</td>
                            <td class="status-${login.status || 'unknown'}">${login.status === 'success' ? 'Success' : 'Failed'}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>

        <div class="section">
            <h2>🚨 Security Alerts</h2>
            ${(securityAlerts || []).length > 0 ? `
                <table>
                    <thead>
                        <tr>
                            <th>Date & Time</th>
                            <th>Alert Type</th>
                            <th>Severity</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${(securityAlerts || []).map(alert => `
                            <tr>
                                <td>${alert.createdAt.toLocaleString()}</td>
                                <td>${alert.action}</td>
                                <td class="severity-${alert.severity.toLowerCase()}">${alert.severity}</td>
                                <td>${alert.status}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            ` : '<p>No security alerts during this period. ✅</p>'}
        </div>

        <div class="footer">
            <p>This report was generated automatically by CyberGuard Security System</p>
            <p>Generated on: ${new Date().toLocaleString()}</p>
        </div>
    </body>
    </html>
    `
  }

  /**
   * Get system statistics for admin report
   * @param {Date} startDate - Start date
   * @param {Date} endDate - End date
   * @returns {Promise<Object>} System statistics
   */
  async getSystemStats(startDate, endDate) {
    const [totalUsers, newUsers, totalAlerts, blockedIPs] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ createdAt: { $gte: startDate, $lte: endDate } }),
      Log.countDocuments({ createdAt: { $gte: startDate, $lte: endDate } }),
      BlockedIP.countDocuments({ isActive: true })
    ])

    return { totalUsers, newUsers, totalAlerts, blockedIPs }
  }

  /**
   * Get threat analysis for admin report
   * @param {Date} startDate - Start date
   * @param {Date} endDate - End date
   * @returns {Promise<Array>} Threat analysis
   */
  async getThreatAnalysis(startDate, endDate) {
    return await IntrusionEvent.aggregate([
      { $match: { createdAt: { $gte: startDate, $lte: endDate } } },
      {
        $group: {
          _id: '$intrusionType',
          count: { $sum: 1 },
          highSeverity: {
            $sum: { $cond: [{ $in: ['$severity', ['High', 'Critical']] }, 1, 0] }
          }
        }
      },
      { $sort: { count: -1 } }
    ])
  }

  /**
   * Get system user activity for admin report
   * @param {Date} startDate - Start date
   * @param {Date} endDate - End date
   * @returns {Promise<Array>} User activity
   */
  async getSystemUserActivity(startDate, endDate) {
    return await UserActivity.aggregate([
      { $match: { createdAt: { $gte: startDate, $lte: endDate } } },
      {
        $lookup: {
          from: 'users',
          localField: 'user',
          foreignField: '_id',
          as: 'userInfo'
        }
      },
      { $unwind: '$userInfo' },
      {
        $group: {
          _id: '$user',
          user: { $first: '$userInfo' },
          activityCount: { $sum: 1 },
          lastActivity: { $max: '$createdAt' }
        }
      },
      { $sort: { activityCount: -1 } },
      { $limit: 10 }
    ])
  }

  /**
   * Get blocked IPs report
   * @param {Date} startDate - Start date
   * @param {Date} endDate - End date
   * @returns {Promise<Array>} Blocked IPs
   */
  async getBlockedIPsReport(startDate, endDate) {
    return await BlockedIP.find({
      createdAt: { $gte: startDate, $lte: endDate }
    }).sort({ createdAt: -1 }).limit(20)
  }

  /**
   * Get top security alerts
   * @param {Date} startDate - Start date
   * @param {Date} endDate - End date
   * @returns {Promise<Array>} Top alerts
   */
  async getTopSecurityAlerts(startDate, endDate) {
    return await Log.find({
      severity: { $in: ['High', 'Critical'] },
      createdAt: { $gte: startDate, $lte: endDate }
    }).populate('user', 'name email').sort({ createdAt: -1 }).limit(20)
  }

  /**
   * Generate HTML content for reports (unified method)
   * @param {Object} data - Report data
   * @param {string} reportType - Type of report
   * @param {string} userRole - User role (admin/user)
   * @returns {string} HTML content
   */
  generateReportHTML(data, reportType, userRole) {
    if (userRole === 'admin') {
      return this.generateAdminReportHTML(data)
    } else {
      return this.generateUserReportHTML(data)
    }
  }

  /**
   * Generate HTML content for admin report
   * @param {Object} data - Report data
   * @returns {string} HTML content
   */
  generateAdminReportHTML(data) {
    const { periodLabel, systemStats, threatAnalysis, userActivity, blockedIPs, topAlerts } = data

    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>CyberGuard Admin Report</title>
        <style>
            body { font-family: Arial, sans-serif; margin: 0; padding: 20px; color: #333; }
            .header { background: linear-gradient(135deg, #dc3545 0%, #fd7e14 100%); color: white; padding: 30px; text-align: center; margin: -20px -20px 30px -20px; }
            .header h1 { margin: 0; font-size: 28px; }
            .header p { margin: 10px 0 0 0; opacity: 0.9; }
            .section { margin-bottom: 30px; }
            .section h2 { color: #dc3545; border-bottom: 2px solid #dc3545; padding-bottom: 10px; }
            .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin: 20px 0; }
            .stat-card { background: #f8f9fa; padding: 20px; border-radius: 8px; text-align: center; border-left: 4px solid #dc3545; }
            .stat-value { font-size: 24px; font-weight: bold; color: #dc3545; }
            .stat-label { color: #666; margin-top: 5px; }
            table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            th, td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
            th { background-color: #f8f9fa; font-weight: bold; }
            .severity-critical { color: #dc3545; font-weight: bold; }
            .severity-high { color: #fd7e14; font-weight: bold; }
            .severity-medium { color: #ffc107; font-weight: bold; }
            .footer { text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 12px; }
        </style>
    </head>
    <body>
        <div class="header">
            <h1>🚨 CyberGuard Admin Report</h1>
            <p>${periodLabel}</p>
            <p>System Security Overview</p>
        </div>

        <div class="section">
            <h2>📊 System Statistics</h2>
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-value">${systemStats.totalUsers}</div>
                    <div class="stat-label">Total Users</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${systemStats.newUsers}</div>
                    <div class="stat-label">New Users</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${systemStats.totalAlerts}</div>
                    <div class="stat-label">Security Alerts</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${systemStats.blockedIPs}</div>
                    <div class="stat-label">Blocked IPs</div>
                </div>
            </div>
        </div>

        <div class="section">
            <h2>🎯 Threat Analysis</h2>
            ${threatAnalysis.length > 0 ? `
                <table>
                    <thead>
                        <tr>
                            <th>Threat Type</th>
                            <th>Total Incidents</th>
                            <th>High Severity</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${threatAnalysis.map(threat => `
                            <tr>
                                <td>${threat._id.replace('_', ' ').toUpperCase()}</td>
                                <td>${threat.count}</td>
                                <td class="severity-high">${threat.highSeverity}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            ` : '<p>No threats detected during this period. ✅</p>'}
        </div>

        <div class="section">
            <h2>🚨 Critical Security Alerts</h2>
            ${topAlerts.length > 0 ? `
                <table>
                    <thead>
                        <tr>
                            <th>Date & Time</th>
                            <th>Alert Type</th>
                            <th>User</th>
                            <th>Severity</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${topAlerts.map(alert => `
                            <tr>
                                <td>${alert.createdAt.toLocaleString()}</td>
                                <td>${alert.action}</td>
                                <td>${alert.user ? alert.user.email : 'System'}</td>
                                <td class="severity-${alert.severity.toLowerCase()}">${alert.severity}</td>
                                <td>${alert.status}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            ` : '<p>No critical alerts during this period. ✅</p>'}
        </div>

        <div class="footer">
            <p>This report was generated automatically by CyberGuard Security System</p>
            <p>Generated on: ${new Date().toLocaleString()}</p>
        </div>
    </body>
    </html>
    `
  }
}

// Export singleton instance
module.exports = new ReportService()