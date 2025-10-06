const fetch = require('node-fetch')

async function testConnection() {
  const baseUrl = 'http://localhost:5000'
  
  console.log('Testing backend connectivity...')
  console.log('Base URL:', baseUrl)
  
  try {
    // Test health endpoint
    console.log('\n1. Testing health endpoint...')
    const healthResponse = await fetch(`${baseUrl}/api/health`)
    console.log('Health Status:', healthResponse.status)
    
    if (healthResponse.ok) {
      const healthData = await healthResponse.json()
      console.log('Health Data:', healthData)
    }
    
    // Test CORS preflight
    console.log('\n2. Testing CORS preflight...')
    const corsResponse = await fetch(`${baseUrl}/api/health`, {
      method: 'OPTIONS',
      headers: {
        'Origin': 'http://localhost:8080',
        'Access-Control-Request-Method': 'GET',
        'Access-Control-Request-Headers': 'Content-Type,Authorization'
      }
    })
    console.log('CORS Status:', corsResponse.status)
    console.log('CORS Headers:', Object.fromEntries(corsResponse.headers.entries()))
    
  } catch (error) {
    console.error('Connection test failed:', error.message)
  }
}

testConnection()






