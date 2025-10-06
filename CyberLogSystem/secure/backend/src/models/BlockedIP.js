const mongoose = require('mongoose')

/**
 * BlockedIP Model - Manages IP addresses that have been blocked due to suspicious activity
 * This model handles automatic and manual IP blocking for intrusion prevention
 */
const blockedIPSchema = new mongoose.Schema(
  {
    // The IP address that is blocked
    ipAddress: {
      type: String,
      required: true,
      unique: true, // Ensure no duplicate blocked IPs
      index: true   // Index for fast lookups during request filtering
    },
    
    // Reason why this IP was blocked
    reason: {
      type: String,
      enum: [
        'brute_force_attack',    // Multiple failed login attempts
        'ddos_attack',           // Distributed denial of service
        'malicious_requests',    // Suspicious HTTP requests
        'intrusion_attempt',     // Detected intrusion attempt
        'manual_block',          // Manually blocked by admin
        'repeated_violations',   // Multiple security violations
        'suspicious_activity'    // General suspicious behavior
      ],
      required: true
    },
    
    // How the block was initiated
    blockType: {
      type: String,
      enum: ['automatic', 'manual'], // System-generated or admin-initiated
      default: 'automatic'
    },
    
    // Admin who manually blocked this IP (if applicable)
    blockedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    
    // When the block expires (null = permanent)
    expiresAt: {
      type: Date,
      default: null
    },
    
    // Whether this block is currently active
    isActive: {
      type: Boolean,
      default: true
    },
    
    // Number of attempts that led to this block
    violationCount: {
      type: Number,
      default: 1
    },
    
    // Geographic information about the IP
    location: {
      country: String,
      city: String,
      region: String,
      isp: String // Internet Service Provider
    },
    
    // Related intrusion events that caused this block
    relatedEvents: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'IntrusionEvent'
    }],
    
    // Additional notes or metadata
    notes: {
      type: String,
      default: '',
      trim: true
    },
    
    // Last time this IP attempted access while blocked
    lastAttempt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true
  }
)

// Create compound index for active blocks lookup
blockedIPSchema.index({ ipAddress: 1, isActive: 1 })
blockedIPSchema.index({ expiresAt: 1, isActive: 1 })

/**
 * Check if an IP address is currently blocked
 * @param {string} ipAddress - IP address to check
 * @returns {Promise<boolean>} True if IP is blocked
 */
blockedIPSchema.statics.isBlocked = async function(ipAddress) {
  const now = new Date()
  
  const blockedIP = await this.findOne({
    ipAddress: ipAddress,
    isActive: true,
    $or: [
      { expiresAt: null },           // Permanent block
      { expiresAt: { $gt: now } }    // Temporary block not yet expired
    ]
  })
  
  return !!blockedIP
}

/**
 * Block an IP address with specified parameters
 * @param {string} ipAddress - IP to block
 * @param {string} reason - Reason for blocking
 * @param {Object} options - Additional blocking options
 * @returns {Promise} Created or updated blocked IP record
 */
blockedIPSchema.statics.blockIP = async function(ipAddress, reason, options = {}) {
  const {
    blockType = 'automatic',
    blockedBy = null,
    duration = null, // Duration in minutes (null = permanent)
    location = {},
    notes = ''
  } = options
  
  // Calculate expiration time if duration is specified
  const expiresAt = duration ? new Date(Date.now() + duration * 60 * 1000) : null
  
  // Try to update existing record or create new one
  const blockedIP = await this.findOneAndUpdate(
    { ipAddress },
    {
      $set: {
        reason,
        blockType,
        blockedBy,
        expiresAt,
        isActive: true,
        location,
        notes,
        updatedAt: new Date()
      },
      $inc: { violationCount: 1 } // Increment violation count
    },
    {
      upsert: true,  // Create if doesn't exist
      new: true      // Return updated document
    }
  )
  
  return blockedIP
}

/**
 * Unblock an IP address
 * @param {string} ipAddress - IP to unblock
 * @param {string} unblockedBy - Admin who unblocked (optional)
 * @returns {Promise} Updated blocked IP record
 */
blockedIPSchema.statics.unblockIP = async function(ipAddress, unblockedBy = null) {
  return this.findOneAndUpdate(
    { ipAddress },
    {
      $set: {
        isActive: false,
        unblockedAt: new Date(),
        unblockedBy
      }
    },
    { new: true }
  )
}

/**
 * Clean up expired blocks (should be run periodically)
 * @returns {Promise} Number of blocks cleaned up
 */
blockedIPSchema.statics.cleanupExpiredBlocks = async function() {
  const now = new Date()
  
  const result = await this.updateMany(
    {
      isActive: true,
      expiresAt: { $lte: now }
    },
    {
      $set: { isActive: false }
    }
  )
  
  return result.modifiedCount
}

const BlockedIP = mongoose.model('BlockedIP', blockedIPSchema)
module.exports = BlockedIP