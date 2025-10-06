const express = require('express')
const cors = require('cors')
const dotenv = require('dotenv')
const { connectDB } = require('./src/config/db')
const authRoutes = require('./src/routes/authRoutes')

dotenv.config({ path: '../../.env' })

const app = express()

// Allow ALL origins - no restrictions
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}))

app.use(express.json())

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server working' })
})

app.use('/api/auth', authRoutes)

const port = process.env.PORT || 3000

connectDB()
  .then(() => {
    app.listen(port, () => {
      console.log(`✅ Working server on port ${port}`)
      console.log(`✅ CORS: Allow all origins`)
    })
  })
  .catch(err => {
    console.error('DB Error:', err)
    process.exit(1)
  })