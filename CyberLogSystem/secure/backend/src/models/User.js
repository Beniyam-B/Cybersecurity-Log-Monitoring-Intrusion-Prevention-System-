const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')

// Enhanced user schema with profile information and additional fields
const userSchema = new mongoose.Schema(
  {
    // Basic user information
    name: {
      type: String,
      required: true,
      trim: true
    },
    
    // User's email address (unique identifier)
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },
    
    // Encrypted password for authentication
    password: {
      type: String,
      required: true,
      minlength: 6
    },
    
    // User role (admin or regular user)
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user'
    },
    
    // Account suspension status
    isSuspended: {
      type: Boolean,
      default: false
    },
    
    // Profile picture URL or file path
    profilePicture: {
      type: String,
      default: ''
    },
    
    // Additional profile information
    profile: {
      firstName: {
        type: String,
        trim: true,
        default: ''
      },
      lastName: {
        type: String,
        trim: true,
        default: ''
      },
      phone: {
        type: String,
        trim: true,
        default: ''
      },
      department: {
        type: String,
        trim: true,
        default: ''
      },
      position: {
        type: String,
        trim: true,
        default: ''
      },
      bio: {
        type: String,
        trim: true,
        maxlength: 500,
        default: ''
      }
    },
    
    // Security settings
    security: {
      twoFactorEnabled: {
        type: Boolean,
        default: false
      },
      lastPasswordChange: {
        type: Date,
        default: Date.now
      },
      failedLoginAttempts: {
        type: Number,
        default: 0
      },
      accountLockedUntil: {
        type: Date,
        default: null
      }
    },
    
    // User preferences
    preferences: {
      theme: {
        type: String,
        enum: ['light', 'dark', 'auto'],
        default: 'auto'
      },
      notifications: {
        email: {
          type: Boolean,
          default: true
        },
        security: {
          type: Boolean,
          default: true
        }
      }
    },
    
    // Last activity tracking
    lastLogin: {
      type: Date,
      default: null
    },
    
    // Admin-specific fields (only visible to admins)
    adminInfo: {
      permissions: [{
        type: String,
        enum: ['user_management', 'log_viewing', 'system_settings', 'security_alerts']
      }],
      accessLevel: {
        type: String,
        enum: ['basic', 'advanced', 'super'],
        default: 'basic'
      }
    }
  },
  { 
    timestamps: true 
  }
)

// Create indexes for better query performance
userSchema.index({ email: 1 })
userSchema.index({ role: 1 })
userSchema.index({ isSuspended: 1 })
userSchema.index({ lastLogin: -1 })

// Hash password before saving to database
userSchema.pre('save', async function (next) {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified('password')) return next()
  
  try {
    // Generate a salt with cost factor 10
    const salt = await bcrypt.genSalt(10)
    // Hash the password with the salt
    this.password = await bcrypt.hash(this.password, salt)
    next()
  } catch (error) {
    next(error)
  }
})

// Method to compare password with stored hash
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password)
}

// Method to check if user is admin
userSchema.methods.isAdmin = function () {
  return this.role === 'admin'
}

// Method to check if account is locked
userSchema.methods.isLocked = function () {
  if (!this.security.accountLockedUntil) return false
  return new Date() < this.security.accountLockedUntil
}

// Method to increment failed login attempts
userSchema.methods.incrementFailedLogins = function () {
  this.security.failedLoginAttempts += 1
  
  // Lock account after 5 failed attempts for 30 minutes
  if (this.security.failedLoginAttempts >= 5) {
    this.security.accountLockedUntil = new Date(Date.now() + 30 * 60 * 1000)
  }
  
  return this.save()
}

// Method to reset failed login attempts
userSchema.methods.resetFailedLogins = function () {
  this.security.failedLoginAttempts = 0
  this.security.accountLockedUntil = null
  this.lastLogin = new Date()
  return this.save()
}

const User = mongoose.model('User', userSchema)
module.exports = User

