const express = require('express')
const cors = require('cors')
const dotenv = require('dotenv')

dotenv.config({ path: '../../.env' })

const app = express()

app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}))

app.use(express.json())

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' })
})

app.post('/api/auth/signup', (req, res) => {
  console.log('Signup request received:', req.body)
  res.json({ 
    token: 'test-token',
    user: { 
      id: '123',
      name: req.body.name,
      email: req.body.email,
      role: 'user'
    }
  })
})

const port = process.env.PORT || 3000
app.listen(port, () => {
  console.log(`Server running on port ${port}`)
})