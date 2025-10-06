// Quick start script - minimal server without complex dependencies
const express = require('express')
const cors = require('cors')
const mongoose = require('mongoose')

const app = express()

// Basic middleware
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}))
app.use(express.json())

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/cyberlogsystem')
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err))

// Basic User model
const User = mongoose.model('User', new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String,
  role: { type: String, default: 'user' }
}, { timestamps: true }))

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' })
})

// Signup route
app.post('/api/auth/signup', async (req, res) => {
  try {
    const { name, email, password, adminSecret } = req.body
    
    // Check if user exists
    const exists = await User.findOne({ email })
    if (exists) {
      return res.status(409).json({ message: 'Email already in use' })
    }
    
    // Determine role
    let role = 'user'
    if (adminSecret === 'CYBER_ADMIN_SECRET_2024' || email.includes('admin')) {
      role = 'admin'
    }
    
    // Create user (password stored as plain text for now)
    const user = await User.create({ name, email, password, role })
    
    // Simple token (just user ID for now)
    const token = `token_${user._id}`
    
    res.status(201).json({
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role }
    })
  } catch (error) {
    console.error('Signup error:', error)
    res.status(500).json({ message: 'Signup failed', error: error.message })
  }
})

// Login route
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body
    
    const user = await User.findOne({ email })
    if (!user || user.password !== password) {
      return res.status(401).json({ message: 'Invalid credentials' })
    }
    
    const token = `token_${user._id}`
    
    res.json({
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role }
    })
  } catch (error) {
    console.error('Login error:', error)
    res.status(500).json({ message: 'Login failed', error: error.message })
  }
})

// Start server
const port = 9000
app.listen(port, () => {
  console.log(`🚀 Server running on http://localhost:${port}`)
  console.log(`📡 API available at http://localhost:${port}/api`)
  console.log(`✅ Health check: http://localhost:${port}/api/health`)
})