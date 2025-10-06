const User = require('../models/User')              // User model (accounts, roles, etc.)
const Log = require('../models/Log')                // Security logs model
const UserActivity = require('../models/UserActivity') // Tracks login/logout/user actions
const IntrusionEvent = require('../models/IntrusionEvent') // Intrusion detection events
const BlockedIP = require('../models/BlockedIP')    // Blocked IP addresses

// Dashboard controller for providing real-time analytics data
class DashboardController {
  
  // ---------------------- ADMIN DASHBOARD ----------------------
  async getAdminDashboardData(req, res) {
    try {
      const now = new Date()
      const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) // 7 days back

      // Stats
      const totalUsers = await User.countDocuments({ role: 'user' }) // Total normal users
      const activeUsers = await User.countDocuments({                // Active in last 24h
        lastLogin: { $gte: new Date(now.getTime() - 24 * 60 * 60 * 1000) }
      })
      const suspendedUsers = await User.countDocuments({ isSuspended: true }) // Suspended users
      const securityAlerts = await Log.countDocuments({              // High/Critical logs in last 7 days
        severity: { $in: ['High', 'Critical'] },
        status: 'Active',
        createdAt: { $gte: last7Days }
      })
      const blockedIPs = await Log.countDocuments({                   // Blocked IPs in last 7 days
        status: 'Blocked',
        createdAt: { $gte: last7Days }
      })

      // Threat distribution (group logs by "action" field)
      const threatDistribution = await Log.aggregate([
        { $match: { createdAt: { $gte: last7Days }, action: { $ne: null } } },
        { $group: { _id: '$action', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ])

      // System activity (group user activities by day)
      const systemActivity = await UserActivity.aggregate([
        { $match: { createdAt: { $gte: last7Days } } },
        { $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            count: { $sum: 1 }
        }},
        { $sort: { _id: 1 } }
      ])

      // Recent high/critical alerts
      const recentAlerts = await Log.find({
        severity: { $in: ['High', 'Critical'] },
        createdAt: { $gte: last7Days }
      })
        .populate('user', 'name email')  // Attach user info
        .sort({ createdAt: -1 })
        .limit(10)

      // Active users with activity counts
      const userActivity = await UserActivity.aggregate([
        { $match: { createdAt: { $gte: last7Days } } },
        { $lookup: {                          // Join with "users" collection
            from: 'users',
            localField: 'user',
            foreignField: '_id',
            as: 'userInfo'
        }},
        { $unwind: '$userInfo' },
        { $group: {
            _id: '$user',
            user: { $first: '$userInfo' },
            lastActivity: { $max: '$createdAt' },
            activityCount: { $sum: 1 }
        }},
        { $sort: { lastActivity: -1 } },
        { $limit: 10 }
      ])

      // 📊 Fallback sample data (used if no real data exists)
      const sampleThreatData = [
        { name: 'Brute Force', value: Math.floor(Math.random() * 20) + 5 },
        { name: 'SQL Injection', value: Math.floor(Math.random() * 15) + 3 },
        { name: 'XSS Attack', value: Math.floor(Math.random() * 10) + 2 },
        { name: 'DDoS', value: Math.floor(Math.random() * 8) + 1 }
      ]

      const sampleActivityData = [
        { name: 'Mon', value: Math.floor(Math.random() * 50) + 20 },
        { name: 'Tue', value: Math.floor(Math.random() * 50) + 20 },
        { name: 'Wed', value: Math.floor(Math.random() * 50) + 20 },
        { name: 'Thu', value: Math.floor(Math.random() * 50) + 20 },
        { name: 'Fri', value: Math.floor(Math.random() * 50) + 20 },
        { name: 'Sat', value: Math.floor(Math.random() * 50) + 20 },
        { name: 'Sun', value: Math.floor(Math.random() * 50) + 20 }
      ]

      const sampleRecentAlerts = [
        { time: new Date(Date.now() - 30*60*1000).toLocaleTimeString(),
          type: 'Brute Force Attack', ip: '203.0.113.45', severity: 'High',
          status: 'Active', user: 'admin@company.com' },
        { time: new Date(Date.now() - 2*60*60*1000).toLocaleTimeString(),
          type: 'Suspicious Login', ip: '198.51.100.23', severity: 'Medium',
          status: 'Resolved', user: 'user@company.com' }
      ]

      const sampleUserActivity = [
        { user: 'admin@company.com', lastLogin: new Date(Date.now() - 15*60*1000).toLocaleString(),
          status: 'Online', role: 'admin', activityCount: Math.floor(Math.random() * 50) + 20 },
        { user: 'user@company.com', lastLogin: new Date(Date.now() - 2*60*60*1000).toLocaleString(),
          status: 'Offline', role: 'user', activityCount: Math.floor(Math.random() * 30) + 10 }
      ]

      // Get real intrusion events for threat data
      let realThreatData = [{ name: 'No Threats', value: 0 }]
      try {
        const intrusionStats = await IntrusionEvent.getIntrusionStats(7)
        if (intrusionStats.length > 0) {
          realThreatData = intrusionStats.map(item => ({ 
            name: item._id.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()), 
            value: item.count 
          }))
        }
      } catch (error) {
        console.error('Error getting intrusion stats:', error)
      }

      // Generate activity data for last 7 days (fill missing days with 0)
      const last7DaysActivity = []
      for (let i = 6; i >= 0; i--) {
        const date = new Date()
        date.setDate(date.getDate() - i)
        const dateStr = date.toISOString().split('T')[0]
        const dayName = date.toLocaleDateString('en-US', { weekday: 'short' })
        
        const dayData = systemActivity.find(item => item._id === dateStr)
        last7DaysActivity.push({
          name: dayName,
          value: dayData ? dayData.count : 0
        })
      }

      // Final admin dashboard response with real-time data
      const dashboardData = {
        systemStats: [
          { name: 'Total Users', value: totalUsers, icon: 'Users', status: 'info' },
          { name: 'Security Alerts', value: securityAlerts, icon: 'AlertTriangle', status: securityAlerts > 10 ? 'danger' : securityAlerts > 5 ? 'warning' : 'success' },
          { name: 'Active Sessions', value: activeUsers, icon: 'Activity', status: 'success' },
          { name: 'Blocked IPs', value: blockedIPs, icon: 'Ban', status: blockedIPs > 0 ? 'warning' : 'success' }
        ],
        threatData: realThreatData,
        activityData: last7DaysActivity,
        recentAlerts: recentAlerts.length > 0
          ? recentAlerts.map(alert => ({
              time: alert.createdAt.toLocaleTimeString(),
              type: alert.action || 'Security Alert',
              ip: alert.ip,
              severity: alert.severity,
              status: alert.status,
              user: alert.user ? alert.user.email : 'System'
          }))
          : [],
        userActivity: userActivity.length > 0
          ? userActivity.map(activity => ({
              user: activity.user.email,
              lastLogin: activity.lastActivity.toLocaleString(),
              status: activity.lastActivity > new Date(now.getTime() - 15*60*1000) ? 'Online' : 'Offline',
              role: activity.user.role,
              activityCount: activity.activityCount
          }))
          : []
      }

      res.json({ success: true, data: dashboardData })

    } catch (error) {
      console.error('Error fetching admin dashboard data:', error)
      res.status(500).json({ success: false, message: 'Failed to fetch dashboard data', error: error.message })
    }
  }

  // ---------------------- USER DASHBOARD ----------------------
  async getUserDashboardData(req, res) {
    try {
      const userId = req.user.id
      const now = new Date()
      const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

      // Count login attempts
      const loginAttempts = await UserActivity.countDocuments({
        user: userId, activityType: 'login', createdAt: { $gte: last7Days }
      })

      // Count alerts specific to user
      const securityAlerts = await Log.countDocuments({
        user: userId, severity: { $in: ['Medium','High','Critical'] },
        createdAt: { $gte: last7Days }
      })

      // Security score (delegates to static method)
      const securityScore = await DashboardController.calculateUserSecurityScore(userId)

      // Last 5 login history (including older records if recent ones don't exist)
      const loginHistory = await UserActivity.find({
        user: userId, activityType: 'login'
      }).sort({ createdAt: -1 }).limit(5)

      // Aggregate daily login activity
      const activityData = await UserActivity.aggregate([
        { $match: { user: userId, createdAt: { $gte: last7Days }, activityType: 'login' } },
        { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, count: { $sum: 1 } } },
        { $sort: { _id: 1 } }
      ])

      // Sample fallbacks
      const sampleActivityData = [
        { name: 'Mon', value: Math.floor(Math.random() * 10) + 1 },
        { name: 'Tue', value: Math.floor(Math.random() * 10) + 1 },
        { name: 'Wed', value: Math.floor(Math.random() * 10) + 1 },
        { name: 'Thu', value: Math.floor(Math.random() * 10) + 1 },
        { name: 'Fri', value: Math.floor(Math.random() * 10) + 1 },
        { name: 'Sat', value: Math.floor(Math.random() * 10) + 1 },
        { name: 'Sun', value: Math.floor(Math.random() * 10) + 1 }
      ]

      const sampleLoginHistory = [
        { date: new Date(Date.now() - 2*60*60*1000).toLocaleString(), ip: '192.168.1.100', location: 'New York, US', status: 'Success' },
        { date: new Date(Date.now() - 24*60*60*1000).toLocaleString(), ip: '192.168.1.101', location: 'New York, US', status: 'Success' }
      ]

      // Session duration calculation (based on login/logout activity)
      const sessions = await UserActivity.find({
        user: userId, activityType: { $in: ['login', 'logout'] },
        createdAt: { $gte: last7Days }
      }).sort({ createdAt: 1 })

      let totalSessionMs = 0, lastLoginTime = null
      for (const act of sessions) {
        if (act.activityType === 'login' && act.status === 'success') {
          lastLoginTime = act.createdAt
        } else if (act.activityType === 'logout' && lastLoginTime) {
          totalSessionMs += (act.createdAt - lastLoginTime)
          lastLoginTime = null
        }
      }
      if (lastLoginTime) totalSessionMs += (now - lastLoginTime)
      const hours = (totalSessionMs / (1000*60*60)).toFixed(1)

      // Generate activity data for last 7 days (fill missing days with 0)
      const last7DaysData = []
      for (let i = 6; i >= 0; i--) {
        const date = new Date()
        date.setDate(date.getDate() - i)
        const dateStr = date.toISOString().split('T')[0]
        const dayName = date.toLocaleDateString('en-US', { weekday: 'short' })
        
        const dayData = activityData.find(item => item._id === dateStr)
        last7DaysData.push({
          name: dayName,
          value: dayData ? dayData.count : 0
        })
      }

      // Final user dashboard data with real-time information
      const dashboardData = {
        userStats: [
          { name: 'Login Attempts', value: loginAttempts, icon: 'Activity', status: 'success' },
          { name: 'Security Alerts', value: securityAlerts, icon: 'AlertTriangle', status: securityAlerts > 0 ? 'warning' : 'success' },
          { name: 'Session Duration', value: `${hours}h`, icon: 'Clock', status: 'info' },
          { name: 'Security Score', value: `${securityScore}%`, icon: 'Shield', status: securityScore >= 80 ? 'success' : securityScore >= 60 ? 'warning' : 'danger' }
        ],
        activityData: last7DaysData,
        loginHistory: loginHistory.length > 0
          ? loginHistory.map(login => ({
              date: login.createdAt.toLocaleString(),
              ip: login.ipAddress || req.ip || req.connection.remoteAddress || 'Unknown',
              location: login.location?.city ? `${login.location.city}, ${login.location.country}` : 'Unknown Location',
              status: login.status === 'success' ? 'Success' : 'Failed'
          }))
          : [{
              date: new Date().toLocaleString(),
              ip: req.ip || req.connection.remoteAddress || req.headers['x-forwarded-for'] || 'Current Session',
              location: 'Current Location',
              status: 'Success'
          }]
      }

      res.json({ success: true, data: dashboardData })

    } catch (error) {
      console.error('Error fetching user dashboard data:', error)
      res.status(500).json({ success: false, message: 'Failed to fetch dashboard data', error: error.message })
    }
  }

  // ---------------------- SECURITY SCORE CALCULATOR ----------------------
  static async calculateUserSecurityScore(userId) {
    try {
      const last30Days = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

      const failedLogins = await UserActivity.countDocuments({
        user: userId, activityType: 'login', status: 'failed',
        createdAt: { $gte: last30Days }
      })

      const securityAlerts = await Log.countDocuments({
        user: userId, severity: { $in: ['Medium','High','Critical'] },
        createdAt: { $gte: last30Days }
      })

      const user = await User.findById(userId)
      const daysSincePasswordChange = user?.security?.lastPasswordChange
        ? Math.floor((Date.now() - user.security.lastPasswordChange) / (1000*60*60*24))
        : 0

      // Start with perfect score = 100
      let score = 100
      score -= Math.min(failedLogins * 5, 20)   // Deduct for failed logins
      score -= Math.min(securityAlerts * 3, 15) // Deduct for alerts
      if (daysSincePasswordChange > 90) score -= 10
      else if (daysSincePasswordChange > 60) score -= 5

      return Math.max(score, 0) // Never below 0
    } catch (error) {
      console.error('Error calculating security score:', error)
      return 85 // fallback
    }
  }
}

module.exports = new DashboardController()
