const mongoose = require('mongoose')

// UserActivity model to track detailed user activities for dashboard analytics
const userActivitySchema = new mongoose.Schema(
  {
    // Reference to the user who performed the activity
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    
    // Type of activity performed
    activityType: {
      type: String,
      enum: [
        'login',
        'logout',
        'profile_update',
        'password_change',
        'security_setting_change',
        'dashboard_access',
        'report_generation',
        'file_upload',
        'file_download',
        'admin_action',
        'system_setting_change'
      ],
      required: true
    },
    
    // Detailed description of the activity
    description: {
      type: String,
      required: true,
      trim: true
    },
    
    // IP address of the user
    ipAddress: {
      type: String,
      required: true
    },
    
    // User agent information
    userAgent: {
      type: String,
      default: ''
    },
    
    // Geographic location (if available)
    location: {
      country: String,
      city: String,
      region: String
    },
    
    // Session information
    sessionId: {
      type: String,
      default: ''
    },
    
    // Additional metadata about the activity
    metadata: {
      type: Object,
      default: {}
    },
    
    // Status of the activity
    status: {
      type: String,
      enum: ['success', 'failed', 'pending', 'cancelled'],
      default: 'success'
    },
    
    // Duration of the activity (in milliseconds)
    duration: {
      type: Number,
      default: 0
    },
    
    // Resource accessed (if applicable)
    resource: {
      type: String,
      default: ''
    },
    
    // Risk level associated with the activity
    riskLevel: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'low'
    }
  },
  {
    timestamps: true
  }
)

// Create indexes for better query performance
userActivitySchema.index({ user: 1, createdAt: -1 })
userActivitySchema.index({ activityType: 1, createdAt: -1 })
userActivitySchema.index({ createdAt: -1 })
userActivitySchema.index({ status: 1, createdAt: -1 })
userActivitySchema.index({ riskLevel: 1, createdAt: -1 })

// Static method to get activity statistics for dashboard
userActivitySchema.statics.getDashboardStats = async function (userId = null, days = 7) {
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days)
  
  const matchStage = userId 
    ? { user: mongoose.Types.ObjectId(userId), createdAt: { $gte: startDate } }
    : { createdAt: { $gte: startDate } }
  
  const pipeline = [
    { $match: matchStage },
    {
      $group: {
        _id: {
          $dateToString: { format: "%Y-%m-%d", date: "$createdAt" }
        },
        count: { $sum: 1 },
        activities: { $push: "$$ROOT" }
      }
    },
    { $sort: { _id: 1 } }
  ]
  
  return this.aggregate(pipeline)
}

// Static method to get activity distribution by type
userActivitySchema.statics.getActivityDistribution = async function (userId = null, days = 7) {
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days)
  
  const matchStage = userId 
    ? { user: mongoose.Types.ObjectId(userId), createdAt: { $gte: startDate } }
    : { createdAt: { $gte: startDate } }
  
  const pipeline = [
    { $match: matchStage },
    {
      $group: {
        _id: "$activityType",
        count: { $sum: 1 }
      }
    },
    { $sort: { count: -1 } }
  ]
  
  return this.aggregate(pipeline)
}

// Static method to get risk level distribution
userActivitySchema.statics.getRiskDistribution = async function (userId = null, days = 7) {
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days)
  
  const matchStage = userId 
    ? { user: mongoose.Types.ObjectId(userId), createdAt: { $gte: startDate } }
    : { createdAt: { $gte: startDate } }
  
  const pipeline = [
    { $match: matchStage },
    {
      $group: {
        _id: "$riskLevel",
        count: { $sum: 1 }
      }
    },
    { $sort: { count: -1 } }
  ]
  
  return this.aggregate(pipeline)
}

const UserActivity = mongoose.model('UserActivity', userActivitySchema)
module.exports = UserActivity

