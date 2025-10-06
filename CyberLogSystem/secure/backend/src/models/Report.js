const mongoose = require('mongoose')

const reportSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    required: true,
    enum: ['security', 'activity', 'compliance', 'threats'],
    default: 'security'
  },
  dateRange: {
    type: String,
    required: true
  },
  generatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['generating', 'completed', 'failed'],
    default: 'generating'
  },
  size: {
    type: String,
    default: '0 KB'
  },
  downloadCount: {
    type: Number,
    default: 0
  },
  filePath: {
    type: String // Optional: store actual file path if saving to disk
  }
}, {
  timestamps: true
})

// Index for faster queries
reportSchema.index({ generatedBy: 1, createdAt: -1 })
reportSchema.index({ status: 1 })

// Virtual for formatted creation date
reportSchema.virtual('generatedAt').get(function() {
  return this.createdAt.toLocaleString()
})

// Method to increment download count
reportSchema.methods.incrementDownload = function() {
  this.downloadCount += 1
  return this.save()
}

module.exports = mongoose.model('Report', reportSchema)