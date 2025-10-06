const express = require('express')
const { protect } = require('../middleware/authMiddleware')
const { isAdmin } = require('../middleware/adminMiddleware')
const Log = require('../models/Log')

const router = express.Router()

// Get all logs (admin only)
router.get('/', protect, isAdmin, async (req, res) => {
  try {
    const logs = await Log.find()
      .populate('user', 'email name')
      .sort({ createdAt: -1 })
      .limit(100)
    res.json({ success: true, data: logs })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// Get user's logs
router.get('/me', protect, async (req, res) => {
  try {
    const logs = await Log.find({ user: req.user.id })
      .sort({ createdAt: -1 })
      .limit(50)
    res.json({ success: true, data: logs })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

module.exports = router

