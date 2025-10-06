const express = require('express')
const router = express.Router()
const { protect } = require('../middleware/authMiddleware')

// Import profile controller
const profileController = require('../controllers/profileController')

// Route to get user profile
router.get('/', protect, profileController.getUserProfile)

// Route to update user profile
router.put('/', protect, profileController.updateUserProfile)

// Route to update profile picture
router.put('/picture', protect, profileController.updateProfilePicture)

// Route to change password
router.put('/password', protect, profileController.changePassword)

// Route to get user settings
router.get('/settings', protect, profileController.getUserSettings)

module.exports = router




