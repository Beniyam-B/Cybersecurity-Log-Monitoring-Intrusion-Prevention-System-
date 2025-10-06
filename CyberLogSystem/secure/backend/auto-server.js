const express = require('express')
const cors = require('cors')
const mongoose = require('mongoose')
const net = require('net')

const app = express()

// Basic middleware
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}))
app.use(express.json())

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/cyberlogsystem')
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch(err => console.error('❌ MongoDB connection error:', err))

// Basic User model
const User = mongoose.model('User', new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String,
  role: { type: String, default: 'user' }
}, { timestamps: true }))

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'CyberLogSystem API is running' })
})

// Signup route
app.post('/api/auth/signup', async (req, res) => {
  try {
    console.log('📝 Signup request:', req.body)
    const { name, email, password, adminSecret } = req.body
    
    const exists = await User.findOne({ email })
    if (exists) {
      return res.status(409).json({ message: 'Email already in use' })
    }
    
    let role = 'user'
    if (adminSecret === 'CYBER_ADMIN_SECRET_2024' || email.includes('admin')) {
      role = 'admin'
    }
    
    const user = await User.create({ name, email, password, role })
    const token = `token_${user._id}`
    
    console.log('✅ User created:', { email, role })
    res.status(201).json({
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role }
    })
  } catch (error) {
    console.error('❌ Signup error:', error)
    res.status(500).json({ message: 'Signup failed', error: error.message })
  }
})

// Login route
app.post('/api/auth/login', async (req, res) => {
  try {
    console.log('🔐 Login request:', req.body.email)
    const { email, password } = req.body
    
    const user = await User.findOne({ email })
    if (!user || user.password !== password) {
      return res.status(401).json({ message: 'Invalid credentials' })
    }
    
    const token = `token_${user._id}`
    console.log('✅ Login successful:', email)
    
    res.json({
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role }
    })
  } catch (error) {
    console.error('❌ Login error:', error)
    res.status(500).json({ message: 'Login failed', error: error.message })
  }
})

// Function to find available port
function findAvailablePort(startPort) {
  return new Promise((resolve) => {
    const server = net.createServer()
    server.listen(startPort, () => {
      const port = server.address().port
      server.close(() => resolve(port))
    })
    server.on('error', () => {
      resolve(findAvailablePort(startPort + 1))
    })
  })
}

// Start server
async function startServer() {
  const port = await findAvailablePort(9000)
  
  app.listen(port, () => {
    console.log(`\n🚀 CyberLogSystem API Server Started`)
    console.log(`📡 Server: http://localhost:${port}`)
    console.log(`🏥 Health: http://localhost:${port}/api/health`)
    console.log(`\n⚠️  UPDATE YOUR FRONTEND:`)
    console.log(`   Change API_BASE_URL to: http://localhost:${port}/api`)
    console.log(`\n🔑 Admin Secret: CYBER_ADMIN_SECRET_2024`)
  })
}

startServer()