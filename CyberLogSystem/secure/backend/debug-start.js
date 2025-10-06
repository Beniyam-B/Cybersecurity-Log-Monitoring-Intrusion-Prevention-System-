const dotenv = require('dotenv')
const path = require('path')

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../.env') })

console.log('Environment variables loaded:')
console.log('PORT:', process.env.PORT)
console.log('MONGODB_URI:', process.env.MONGODB_URI)

// Test MongoDB connection first
const mongoose = require('mongoose')

async function testConnection() {
  try {
    console.log('Testing MongoDB connection...')
    await mongoose.connect(process.env.MONGODB_URI)
    console.log('✅ MongoDB connected successfully')
    
    // Start the server
    const express = require('express')
    const cors = require('cors')
    
    const app = express()
    
    app.use(cors({
      origin: process.env.CORS_ORIGIN,
      credentials: true
    }))
    
    app.use(express.json())
    
    app.get('/api/health', (req, res) => {
      res.json({ status: 'ok', db: 'connected' })
    })
    
    app.post('/api/auth/signup', async (req, res) => {
      try {
        const { name, email, password } = req.body
        
        // Simple validation
        if (!name || !email || !password) {
          return res.status(400).json({ message: 'All fields required' })
        }
        
        // Create mock user response
        const user = {
          id: Date.now().toString(),
          name,
          email,
          role: 'user'
        }
        
        const token = 'mock-jwt-token-' + Date.now()
        
        res.status(201).json({ token, user })
      } catch (error) {
        res.status(500).json({ message: error.message })
      }
    })
    
    const port = process.env.PORT || 3000
    app.listen(port, () => {
      console.log(`✅ Server running on http://localhost:${port}`)
      console.log(`✅ Health check: http://localhost:${port}/api/health`)
    })
    
  } catch (error) {
    console.error('❌ Error:', error.message)
    process.exit(1)
  }
}

testConnection()