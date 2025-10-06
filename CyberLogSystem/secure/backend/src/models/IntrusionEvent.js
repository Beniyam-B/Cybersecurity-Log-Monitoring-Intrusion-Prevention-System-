const mongoose = require('mongoose')

/**
 * IntrusionEvent Model - Stores detected security threats and intrusion attempts
 * This model captures detailed information about security incidents for analysis and prevention
 */
const intrusionEventSchema = new mongoose.Schema(
  {
    // Source information of the intrusion attempt
    sourceIp: {
      type: String,
      required: true,
      index: true // Index for fast IP-based queries
    },
    
    // Target information that was attacked
    targetResource: {
      type: String,
      required: true,
      trim: true
    },
    
    // Type of intrusion detected
    intrusionType: {
      type: String,
      enum: [
        'brute_force',      // Multiple failed login attempts
        'sql_injection',    // SQL injection attempt detected
        'xss_attack',       // Cross-site scripting attempt
        'ddos_attack',      // Distributed denial of service
        'port_scan',        // Network port scanning
        'malware_upload',   // Malicious file upload attempt
        'privilege_escalation', // Attempt to gain higher privileges
        'data_exfiltration',    // Unauthorized data access/download
        'suspicious_activity'   // General suspicious behavior
      ],
      required: true
    },
    
    // Severity level of the threat
    severity: {
      type: String,
      enum: ['Low', 'Medium', 'High', 'Critical'],
      default: 'Medium'
    },
    
    // Current status of the incident
    status: {
      type: String,
      enum: ['Active', 'Blocked', 'Investigating', 'Resolved', 'False_Positive'],
      default: 'Active'
    },
    
    // Detailed description of what was detected
    description: {
      type: String,
      required: true,
      trim: true
    },
    
    // User involved (if applicable)
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    
    // Geographic location of the source
    location: {
      country: String,
      city: String,
      region: String,
      latitude: Number,
      longitude: Number
    },
    
    // Request details that triggered the detection
    requestDetails: {
      method: String,        // HTTP method (GET, POST, etc.)
      url: String,          // Requested URL
      userAgent: String,    // Browser/client information
      headers: Object,      // HTTP headers
      payload: Object       // Request body/parameters
    },
    
    // Automated response taken
    responseAction: {
      type: String,
      enum: ['none', 'ip_blocked', 'user_suspended', 'session_terminated', 'alert_sent'],
      default: 'none'
    },
    
    // Whether this event triggered an automatic block
    isBlocked: {
      type: Boolean,
      default: false
    },
    
    // Number of similar events from same source
    repeatCount: {
      type: Number,
      default: 1
    },
    
    // Additional metadata for analysis
    metadata: {
      type: Object,
      default: {}
    }
  },
  {
    timestamps: true // Automatically add createdAt and updatedAt
  }
)

// Create indexes for better query performance
intrusionEventSchema.index({ sourceIp: 1, createdAt: -1 })
intrusionEventSchema.index({ intrusionType: 1, createdAt: -1 })
intrusionEventSchema.index({ severity: 1, status: 1 })
intrusionEventSchema.index({ userId: 1, createdAt: -1 })

/**
 * Static method to get intrusion statistics for dashboard
 * @param {number} days - Number of days to look back
 * @returns {Promise} Aggregated intrusion statistics
 */
intrusionEventSchema.statics.getIntrusionStats = async function(days = 7) {
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days)
  
  return this.aggregate([
    { $match: { createdAt: { $gte: startDate } } },
    {
      $group: {
        _id: '$intrusionType',
        count: { $sum: 1 },
        highSeverity: {
          $sum: { $cond: [{ $in: ['$severity', ['High', 'Critical']] }, 1, 0] }
        }
      }
    },
    { $sort: { count: -1 } }
  ])
}

/**
 * Static method to get top attacking IPs
 * @param {number} limit - Number of top IPs to return
 * @returns {Promise} List of most active attacking IPs
 */
intrusionEventSchema.statics.getTopAttackingIPs = async function(limit = 10) {
  return this.aggregate([
    { $match: { createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } } },
    {
      $group: {
        _id: '$sourceIp',
        attackCount: { $sum: 1 },
        lastAttack: { $max: '$createdAt' },
        severityLevels: { $push: '$severity' }
      }
    },
    { $sort: { attackCount: -1 } },
    { $limit: limit }
  ])
}

const IntrusionEvent = mongoose.model('IntrusionEvent', intrusionEventSchema)
module.exports = IntrusionEvent