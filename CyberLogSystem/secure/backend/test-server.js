const express = require('express')
const cors = require('cors')

const app = express()
app.use(cors())
app.use(express.json())

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running without database' })
})

app.post('/api/auth/signup', (req, res) => {
  res.json({ message: 'Test signup endpoint working' })
})

const port = 5000
app.listen(port, () => {
  console.log(`Test server running on port ${port}`)
  console.log(`Test: http://localhost:${port}/api/health`)
})