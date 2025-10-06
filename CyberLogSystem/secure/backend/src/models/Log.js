const mongoose = require('mongoose')

const logSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    action: { type: String, required: true, trim: true },
    ip: { type: String, required: true },
    severity: { type: String, enum: ['Low', 'Medium', 'High', 'Critical'], default: 'Low' },
    status: { type: String, enum: ['Active', 'Blocked', 'Monitoring', 'Resolved'], default: 'Active' },
    meta: { type: Object, default: {} }
  },
  { timestamps: true }
)

const Log = mongoose.model('Log', logSchema)
module.exports = Log

