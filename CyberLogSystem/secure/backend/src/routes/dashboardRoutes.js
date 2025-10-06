const express = require('express')
const router = express.Router()
const { protect } = require('../middleware/authMiddleware')
const { isAdmin } = require('../middleware/adminMiddleware')

// Import dashboard controller
const dashboardController = require('../controllers/dashboardController')

// Route to get admin dashboard data (admin only)
router.get('/admin', protect, isAdmin, dashboardController.getAdminDashboardData)

// Route to get user dashboard data (authenticated users)
router.get('/user', protect, dashboardController.getUserDashboardData)

module.exports = router

