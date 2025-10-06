const User = require('../models/User')
const UserActivity = require('../models/UserActivity')

// Profile controller for managing user profiles and settings
class ProfileController {
  
  // Get user profile information
  async getUserProfile(req, res) {
    try {
      const userId = req.user.id
      
      // Find user and exclude sensitive information like password and failed login attempts
      const user = await User.findById(userId).select('-password -security.failedLoginAttempts')
      
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        })
      }
      
      // Send successful response with user profile data
      res.json({
        success: true,
        data: user
      })
      
    } catch (error) {
      console.error('Error fetching user profile:', error)
      res.status(500).json({
        success: false,
        message: 'Failed to fetch profile',
        error: error.message
      })
    }
  }
  
  // Update user profile information
  async updateUserProfile(req, res) {
    try {
      const userId = req.user.id
      const updateData = req.body
      
      // Define fields that users are allowed to update for security
      const allowedFields = [
        'profile.firstName',
        'profile.lastName',
        'profile.phone',
        'profile.department',
        'profile.position',
        'profile.bio',
        'preferences.theme',
        'preferences.notifications.email',
        'preferences.notifications.security'
      ]
      
      // Filter out non-allowed fields to prevent unauthorized updates
      const filteredData = {}
      allowedFields.forEach(field => {
        const value = getNestedValue(updateData, field)
        if (value !== undefined) {
          setNestedValue(filteredData, field, value)
        }
      })
      
      // Update user profile with filtered data
      const updatedUser = await User.findByIdAndUpdate(
        userId,
        { $set: filteredData },
        { new: true, runValidators: true }
      ).select('-password')
      
      if (!updatedUser) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        })
      }
      
      // Log the profile update activity for audit trail
      await UserActivity.create({
        user: userId,
        activityType: 'profile_update',
        description: 'Profile information updated',
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        metadata: { updatedFields: Object.keys(filteredData) }
      })
      
      // Send successful response
      res.json({
        success: true,
        message: 'Profile updated successfully',
        data: updatedUser
      })
      
    } catch (error) {
      console.error('Error updating user profile:', error)
      res.status(500).json({
        success: false,
        message: 'Failed to update profile',
        error: error.message
      })
    }
  }
  
  // Update user profile picture
  async updateProfilePicture(req, res) {
    try {
      const userId = req.user.id
      const { profilePictureUrl } = req.body
      
      if (!profilePictureUrl) {
        return res.status(400).json({
          success: false,
          message: 'Profile picture URL is required'
        })
      }
      
      // Update user's profile picture
      const updatedUser = await User.findByIdAndUpdate(
        userId,
        { profilePicture: profilePictureUrl },
        { new: true, runValidators: true }
      ).select('-password')
      
      if (!updatedUser) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        })
      }
      
      // Log the profile picture update activity
      await UserActivity.create({
        user: userId,
        activityType: 'profile_update',
        description: 'Profile picture updated',
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        metadata: { action: 'profile_picture_update' }
      })
      
      // Send successful response
      res.json({
        success: true,
        message: 'Profile picture updated successfully',
        data: { profilePicture: updatedUser.profilePicture }
      })
      
    } catch (error) {
      console.error('Error updating profile picture:', error)
      res.status(500).json({
        success: false,
        message: 'Failed to update profile picture',
        error: error.message
      })
    }
  }
  
  // Change user password
  async changePassword(req, res) {
    try {
      const userId = req.user.id
      const { currentPassword, newPassword } = req.body
      
      if (!currentPassword || !newPassword) {
        return res.status(400).json({
          success: false,
          message: 'Current password and new password are required'
        })
      }
      
      // Find user to verify current password
      const user = await User.findById(userId)
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        })
      }
      
      // Verify current password is correct
      const isPasswordValid = await user.comparePassword(currentPassword)
      if (!isPasswordValid) {
        return res.status(400).json({
          success: false,
          message: 'Current password is incorrect'
        })
      }
      
      // Update password and set last password change timestamp
      user.password = newPassword
      user.security.lastPasswordChange = new Date()
      await user.save()
      
      // Log the password change activity for security audit
      await UserActivity.create({
        user: userId,
        activityType: 'password_change',
        description: 'Password changed successfully',
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        metadata: { action: 'password_change' }
      })
      
      // Send successful response
      res.json({
        success: true,
        message: 'Password changed successfully'
      })
      
    } catch (error) {
      console.error('Error changing password:', error)
      res.status(500).json({
        success: false,
        message: 'Failed to change password',
        error: error.message
      })
    }
  }
  
  // Get user settings
  async getUserSettings(req, res) {
    try {
      const userId = req.user.id
      
      // Get user preferences and security settings (excluding sensitive data)
      const user = await User.findById(userId).select('preferences security profilePicture')
      
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        })
      }
      
      // Send successful response with user settings
      res.json({
        success: true,
        data: {
          preferences: user.preferences,
          security: {
            twoFactorEnabled: user.security.twoFactorEnabled,
            lastPasswordChange: user.security.lastPasswordChange
          },
          profilePicture: user.profilePicture
        }
      })
      
    } catch (error) {
      console.error('Error fetching user settings:', error)
      res.status(500).json({
        success: false,
        message: 'Failed to fetch settings',
        error: error.message
      })
    }
  }
}

// Helper function to get nested object values by dot notation path
function getNestedValue(obj, path) {
  return path.split('.').reduce((current, key) => {
    return current && current[key] !== undefined ? current[key] : undefined
  }, obj)
}

// Helper function to set nested object values by dot notation path
function setNestedValue(obj, path, value) {
  const keys = path.split('.')
  const lastKey = keys.pop()
  const target = keys.reduce((current, key) => {
    if (!current[key]) current[key] = {}
    return current[key]
  }, obj)
  target[lastKey] = value
}

module.exports = new ProfileController()











