const mongoose = require('mongoose')

async function connectDB() {
  const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/cyberlogsystem'
  if (!mongoUri) {
    throw new Error('MONGODB_URI is not set')
  }

  mongoose.set('strictQuery', true)

  await mongoose.connect(mongoUri, {
    autoIndex: true
  })

  console.log('Connected to MongoDB')
}

module.exports = { connectDB }

