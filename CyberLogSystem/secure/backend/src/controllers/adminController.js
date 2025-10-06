// Import required modules
const { StatusCodes } = require('http-status-codes')  // Clean HTTP status codes
const User = require('../models/User')                // Mongoose User model
const Log = require('../models/Log')                  // Mongoose Log model

// ---------------------- GET BASIC ADMIN STATS ----------------------
exports.getStats = async (req, res, next) => {
  try {
    // Use Promise.all to fetch data in parallel (faster than sequential calls)
    const [totalUsers, totalLogs, activeSessions] = await Promise.all([
      User.countDocuments(),         // Count total users in DB
      Log.countDocuments(),          // Count total logs in DB
      Promise.resolve(0)             // Placeholder: activeSessions (not yet implemented)
    ])

    // Respond with the collected statistics
    res.json({ totalUsers, totalLogs, activeSessions })
  } catch (err) {
    next(err) // Pass error to Express error handler
  }
}

// ---------------------- LIST ALL USERS ----------------------
exports.listUsers = async (req, res, next) => {
  try {
    // Find all users:
    // - Exclude the password field (for security)
    // - Sort newest first (descending by creation date)
    const users = await User.find()
      .select('-password')
      .sort({ createdAt: -1 })

    // Return user list
    res.json({ users })
  } catch (err) {
    next(err)
  }
}

// ---------------------- SUSPEND OR UNSUSPEND A USER ----------------------
exports.setUserSuspended = async (req, res, next) => {
  try {
    const { userId } = req.params       // Extract userId from route params
    const { suspended } = req.body      // Extract suspend flag from request body

    // Update the user's suspension status:
    // - `!!suspended` ensures it's a boolean (true/false)
    // - `{ new: true }` makes sure the updated document is returned
    const user = await User.findByIdAndUpdate(
      userId,
      { isSuspended: !!suspended },
      { new: true }
    ).select('-password')  // Exclude password field again for security

    // If user not found, return 404
    if (!user) {
      return res.status(StatusCodes.NOT_FOUND).json({ message: 'User not found' })
    }

    // Return the updated user object
    res.json({ user })
  } catch (err) {
    next(err)
  }
}
