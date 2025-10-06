#!/usr/bin/env node

const { spawn } = require('child_process')
const path = require('path')
const fs = require('fs')

console.log('🚀 Starting CyberLogSystem Backend in Development Mode...\n')

// Check if .env file exists
const envPath = path.join(__dirname, '.env')
if (!fs.existsSync(envPath)) {
  console.log('⚠️  No .env file found. Creating from env.example...')
  
  const envExamplePath = path.join(__dirname, 'env.example')
  if (fs.existsSync(envExamplePath)) {
    fs.copyFileSync(envExamplePath, envPath)
    console.log('✅ Created .env file from env.example')
    console.log('📝 Please update the .env file with your actual values\n')
  } else {
    console.log('❌ env.example file not found. Please create a .env file manually.')
    process.exit(1)
  }
}

// Check if MongoDB is running
console.log('🔍 Checking MongoDB connection...')
const mongoCheck = spawn('mongosh', ['--eval', 'db.runCommand("ping")'], { 
  stdio: 'pipe',
  shell: true 
})

mongoCheck.on('close', (code) => {
  if (code === 0) {
    console.log('✅ MongoDB is running')
    startServer()
  } else {
    console.log('❌ MongoDB is not running. Please start MongoDB first.')
    console.log('💡 You can start MongoDB with: mongod')
    process.exit(1)
  }
})

mongoCheck.on('error', (err) => {
  console.log('❌ MongoDB check failed:', err.message)
  console.log('💡 Please ensure MongoDB is installed and running')
  process.exit(1)
})

function startServer() {
  console.log('\n🚀 Starting Express server...')
  
  const server = spawn('node', ['server.js'], {
    stdio: 'inherit',
    cwd: __dirname,
    env: {
      ...process.env,
      NODE_ENV: 'development'
    }
  })

  server.on('error', (err) => {
    console.error('❌ Failed to start server:', err)
    process.exit(1)
  })

  server.on('close', (code) => {
    if (code !== 0) {
      console.log(`\n❌ Server exited with code ${code}`)
      process.exit(code)
    }
  })

  // Handle process termination
  process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down server...')
    server.kill('SIGINT')
    process.exit(0)
  })

  process.on('SIGTERM', () => {
    console.log('\n🛑 Shutting down server...')
    server.kill('SIGTERM')
    process.exit(0)
  })
}






