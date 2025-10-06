/**
 * Clean startup script for CyberLogSystem backend
 * This script suppresses deprecation warnings and starts the server cleanly
 */

// Suppress specific deprecation warnings
process.removeAllListeners('warning')
process.on('warning', (warning) => {
  // Only show warnings that are not deprecation warnings
  if (warning.name !== 'DeprecationWarning') {
    console.warn(warning.name, warning.message)
  }
})

// Set environment to suppress punycode warnings
process.env.NODE_NO_WARNINGS = '1'

// Start the main server
require('./server.js')