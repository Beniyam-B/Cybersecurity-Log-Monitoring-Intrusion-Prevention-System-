// Import required packages and models
const { validationResult } = require('express-validator')  // To validate request input
const { StatusCodes } = require('http-status-codes')       // For clean HTTP status codes
const Log = require('../models/Log')                       // Mongoose Log model

// ---------------------- CREATE A NEW LOG ----------------------
exports.createLog = async (req, res, next) => {
  try {
    // 1. Check for validation errors (comes from express-validator middlewares)
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(StatusCodes.BAD_REQUEST).json({ errors: errors.array() })
    }

    // 2. Destructure data from the request body
    const { action, ip, severity, status, meta } = req.body

    // 3. Create a new log entry in the database
    // - user: pulled from req.user.id (set earlier by auth middleware)
    const log = await Log.create({
      user: req.user.id,
      action,
      ip,
      severity,
      status,
      meta
    })

    // 4. Return the created log with status 201 (Created)
    res.status(StatusCodes.CREATED).json({ log })
  } catch (err) {
    // Pass errors to Express error handler middleware
    next(err)
  }
}

// ---------------------- GET LOGS FOR CURRENT USER ----------------------
exports.getMyLogs = async (req, res, next) => {
  try {
    // 1. Find all logs where user matches the logged-in user's id
    // 2. Sort them by creation date (newest first)
    const logs = await Log.find({ user: req.user.id }).sort({ createdAt: -1 })

    // 3. Send back logs as JSON
    res.json({ logs })
  } catch (err) {
    next(err)
  }
}

// ---------------------- GET ALL LOGS (ADMIN PURPOSES) ----------------------
exports.getAllLogs = async (req, res, next) => {
  try {
    // 1. Get pagination parameters from query (defaults: page=1, limit=20)
    const { page = 1, limit = 20 } = req.query

    // 2. Fetch all logs:
    //    - populate user info (email, role) for each log
    //    - sort newest first
    //    - skip and limit for pagination
    const logs = await Log.find({})
      .populate('user', 'email role')              // Show only "email" and "role" fields of user
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)                    // Skip logs for previous pages
      .limit(Number(limit))                        // Limit to "limit" logs per page

    // 3. Count total logs in DB (for pagination info)
    const count = await Log.countDocuments()

    // 4. Send logs + total count as JSON
    res.json({ logs, count })
  } catch (err) {
    next(err)
  }
}
