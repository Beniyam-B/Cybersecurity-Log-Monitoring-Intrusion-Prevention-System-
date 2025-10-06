/**
 * Report Routes - Handles PDF report generation endpoints
 * These routes allow users and admins to download security reports
 */

const express = require('express')
const router = express.Router()
const { protect } = require('../middleware/authMiddleware') // JWT authentication
const { isAdmin } = require('../middleware/adminMiddleware') // Admin role check
const reportService = require('../services/reportService') // PDF generation service
const Report = require('../models/Report') // Report model for storing report metadata

/**
 * GET /api/reports/user/:reportType
 * Generate and download user security report
 * Available report types: daily, weekly, monthly
 * Requires: User authentication
 */
router.get('/user/:reportType?', protect, async (req, res) => {
  try {
    const userId = req.user.id
    const reportType = req.params.reportType || 'weekly'
    
    // Validate report type
    const validTypes = ['daily', 'weekly', 'monthly']
    if (!validTypes.includes(reportType)) {
      return res.status(400).json({ 
        message: 'Invalid report type. Use: daily, weekly, or monthly' 
      })
    }

    // Generate report data
    const reportData = await reportService.generateUserReport(userId, reportType)
    
    // Send JSON response
    res.json({ success: true, data: reportData })
    
  } catch (error) {
    console.error('Error generating user report:', error)
    res.status(500).json({ 
      message: 'Failed to generate report', 
      error: error.message 
    })
  }
})

/**
 * GET /api/reports/admin/:reportType
 * Generate and download admin system report
 * Available report types: daily, weekly, monthly
 * Requires: Admin authentication
 */
router.get('/admin/:reportType?', protect, isAdmin, async (req, res) => {
  try {
    const reportType = req.params.reportType || 'weekly'
    
    // Validate report type
    const validTypes = ['daily', 'weekly', 'monthly']
    if (!validTypes.includes(reportType)) {
      return res.status(400).json({ 
        message: 'Invalid report type. Use: daily, weekly, or monthly' 
      })
    }

    // Generate report data
    const reportData = await reportService.generateAdminReport(reportType)
    
    // Send JSON response
    res.json({ success: true, data: reportData })
    
  } catch (error) {
    console.error('Error generating admin report:', error)
    res.status(500).json({ 
      message: 'Failed to generate report', 
      error: error.message 
    })
  }
})

/**
 * GET /api/reports/user-by-admin/:userId/:reportType
 * Generate user report for admin (admin can download any user's report)
 * Requires: Admin authentication
 */
router.get('/user-by-admin/:userId/:reportType?', protect, isAdmin, async (req, res) => {
  try {
    const { userId } = req.params
    const reportType = req.params.reportType || 'weekly'
    
    // Validate report type
    const validTypes = ['daily', 'weekly', 'monthly']
    if (!validTypes.includes(reportType)) {
      return res.status(400).json({ 
        message: 'Invalid report type. Use: daily, weekly, or monthly' 
      })
    }

    // Generate report data for specified user
    const reportData = await reportService.generateUserReport(userId, reportType)
    
    // Send JSON response
    res.json({ success: true, data: reportData })
    
  } catch (error) {
    console.error('Error generating user report for admin:', error)
    res.status(500).json({ 
      message: 'Failed to generate user report', 
      error: error.message 
    })
  }
})

/**
 * GET /api/reports/preview/user/:reportType
 * Preview user report data (JSON format for frontend preview)
 * Requires: User authentication
 */
router.get('/preview/user/:reportType?', protect, async (req, res) => {
  try {
    const userId = req.user.id
    const reportType = req.params.reportType || 'weekly'
    
    // Get date range
    const { startDate, endDate, periodLabel } = reportService.getDateRange(reportType)
    
    // Get preview data
    const [loginHistory, securityAlerts, activityStats] = await Promise.all([
      reportService.getUserLoginHistory(userId, startDate, endDate),
      reportService.getUserSecurityAlerts(userId, startDate, endDate),
      reportService.getUserActivityStats(userId, startDate, endDate)
    ])
    
    res.json({
      periodLabel,
      loginHistory: loginHistory.slice(0, 10), // Limit for preview
      securityAlerts: securityAlerts.slice(0, 10),
      activityStats
    })
    
  } catch (error) {
    console.error('Error generating report preview:', error)
    res.status(500).json({ 
      message: 'Failed to generate report preview', 
      error: error.message 
    })
  }
})

/**
 * GET /api/reports/preview/admin/:reportType
 * Preview admin report data (JSON format for frontend preview)
 * Requires: Admin authentication
 */
router.get('/preview/admin/:reportType?', protect, isAdmin, async (req, res) => {
  try {
    const reportType = req.params.reportType || 'weekly'
    
    // Get date range
    const { startDate, endDate, periodLabel } = reportService.getDateRange(reportType)
    
    // Get preview data
    const [systemStats, threatAnalysis, topAlerts] = await Promise.all([
      reportService.getSystemStats(startDate, endDate),
      reportService.getThreatAnalysis(startDate, endDate),
      reportService.getTopSecurityAlerts(startDate, endDate)
    ])
    
    res.json({
      periodLabel,
      systemStats,
      threatAnalysis,
      topAlerts: topAlerts.slice(0, 10) // Limit for preview
    })
    
  } catch (error) {
    console.error('Error generating admin report preview:', error)
    res.status(500).json({ 
      message: 'Failed to generate report preview', 
      error: error.message 
    })
  }
})

/**
 * POST /api/reports/generate
 * Generate a new report and store metadata
 * Requires: User authentication
 */
router.post('/generate', protect, async (req, res) => {
  try {
    const { type, dateRange, title } = req.body
    const userId = req.user.id
    const userRole = req.user.role
    
    // Validate input
    if (!type || !dateRange) {
      return res.status(400).json({ 
        success: false, 
        message: 'Report type and date range are required' 
      })
    }
    
    // Create report metadata
    const report = new Report({
      title: title || `${type.charAt(0).toUpperCase() + type.slice(1)} Report`,
      type,
      dateRange: `Last ${dateRange} ${dateRange === 1 ? 'day' : 'days'}`,
      generatedBy: userId,
      status: 'generating',
      size: '0 KB'
    })
    
    await report.save()
    
    // Simulate report generation (in real implementation, this would be async)
    setTimeout(async () => {
      try {
        // Generate actual report data
        let reportData
        if (userRole === 'admin') {
          reportData = await reportService.generateAdminReport(type === 'security' ? 'weekly' : 'monthly')
        } else {
          reportData = await reportService.generateUserReport(userId, type === 'security' ? 'weekly' : 'monthly')
        }
        
        // Update report status
        report.status = 'completed'
        report.size = `${Math.floor(Math.random() * 3000 + 500)} KB`
        await report.save()
      } catch (error) {
        report.status = 'failed'
        await report.save()
      }
    }, 2000)
    
    res.json({ 
      success: true, 
      data: report,
      message: 'Report generation started' 
    })
    
  } catch (error) {
    console.error('Error starting report generation:', error)
    res.status(500).json({ 
      success: false,
      message: 'Failed to start report generation', 
      error: error.message 
    })
  }
})

/**
 * GET /api/reports
 * Get list of user's reports
 * Requires: User authentication
 */
router.get('/', protect, async (req, res) => {
  try {
    const userId = req.user.id
    const userRole = req.user.role
    
    // Admin can see all reports, users only see their own
    const query = userRole === 'admin' ? {} : { generatedBy: userId }
    
    const reports = await Report.find(query)
      .populate('generatedBy', 'email name')
      .sort({ createdAt: -1 })
      .limit(50)
    
    res.json({ 
      success: true, 
      data: reports 
    })
    
  } catch (error) {
    console.error('Error fetching reports:', error)
    res.status(500).json({ 
      success: false,
      message: 'Failed to fetch reports', 
      error: error.message 
    })
  }
})

/**
 * GET /api/reports/:id/download
 * Download a specific report
 * Requires: User authentication
 */
router.get('/:id/download', protect, async (req, res) => {
  try {
    const reportId = req.params.id
    const userId = req.user.id
    const userRole = req.user.role
    
    const report = await Report.findById(reportId).populate('generatedBy', 'email name')
    
    if (!report) {
      return res.status(404).json({ 
        success: false, 
        message: 'Report not found' 
      })
    }
    
    // Check permissions (users can only download their own reports, admins can download any)
    if (userRole !== 'admin' && report.generatedBy._id.toString() !== userId) {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied' 
      })
    }
    
    if (report.status !== 'completed') {
      return res.status(400).json({ 
        success: false, 
        message: 'Report is not ready for download' 
      })
    }
    
    // Generate report data for download - use the report owner's ID, not current user
    let reportData
    if (userRole === 'admin') {
      reportData = await reportService.generateAdminReport('weekly')
    } else {
      // For user reports, always use the report owner's ID (who originally generated it)
      reportData = await reportService.generateUserReport(report.generatedBy._id.toString(), 'weekly')
    }
    
    // Generate HTML content
    const htmlContent = reportService.generateReportHTML(reportData, report.type, userRole)
    
    // Set headers for HTML download that can be saved as PDF
    res.setHeader('Content-Type', 'text/html; charset=utf-8')
    res.setHeader('Content-Disposition', `inline; filename="${report.title}.html"`)
    res.setHeader('Cache-Control', 'no-cache')
    
    res.send(htmlContent)
    
  } catch (error) {
    console.error('Error downloading report:', error)
    res.status(500).json({ 
      success: false,
      message: 'Failed to download report', 
      error: error.message 
    })
  }
})

module.exports = router