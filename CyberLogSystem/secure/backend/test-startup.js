// Test if server can start
const dotenv = require('dotenv')
const path = require('path')

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../.env') })

console.log('Testing server startup...')
console.log('PORT:', process.env.PORT)
console.log('MONGODB_URI:', process.env.MONGODB_URI)

try {
  // Try to require the server
  require('./server.js')
  console.log('Server started successfully')
} catch (error) {
  console.error('Server startup failed:', error.message)
  console.error('Full error:', error)
}