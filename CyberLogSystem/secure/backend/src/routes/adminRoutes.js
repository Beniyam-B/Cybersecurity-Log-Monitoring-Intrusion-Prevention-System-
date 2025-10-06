const express = require('express')
const { protect } = require('../middleware/authMiddleware')
const { isAdmin } = require('../middleware/adminMiddleware')
const User = require('../models/User')

const router = express.Router()

// Get all users
router.get('/users', protect, isAdmin, async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 })
    res.json({ success: true, data: users })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// Suspend/Unsuspend user
router.put('/users/:userId/suspend', protect, isAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.userId)
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' })
    }
    
    user.isSuspended = !user.isSuspended
    await user.save()
    
    res.json({ success: true, data: user })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// Update user
router.put('/users/:userId', protect, isAdmin, async (req, res) => {
  try {
    const { name, email, role } = req.body
    const user = await User.findByIdAndUpdate(
      req.params.userId,
      { name, email, role },
      { new: true, runValidators: true }
    ).select('-password')
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' })
    }
    
    res.json({ success: true, data: user })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// Reset user password
router.post('/users/:userId/reset-password', protect, isAdmin, async (req, res) => {
  try {
    const bcrypt = require('bcryptjs')
    const tempPassword = Math.random().toString(36).slice(-8)
    const hashedPassword = await bcrypt.hash(tempPassword, 10)
    
    await User.findByIdAndUpdate(req.params.userId, { 
      password: hashedPassword,
      mustChangePassword: true 
    })
    
    res.json({ success: true, tempPassword, message: 'Password reset successfully' })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// Delete user
router.delete('/users/:userId', protect, isAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.userId)
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' })
    }
    
    if (user.role === 'admin') {
      return res.status(403).json({ success: false, message: 'Cannot delete admin users' })
    }
    
    await User.findByIdAndDelete(req.params.userId)
    res.json({ success: true, message: 'User deleted successfully' })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

module.exports = router

