const https = require('https')

// Extract client IP address from the request
function getClientIp(req) {
  const xff = req.headers['x-forwarded-for']  // If server is behind a proxy/load balancer, this header may contain client IP
  if (xff && typeof xff === 'string') {
    return xff.split(',')[0].trim()  // Take the first IP in case multiple are listed
  }
  // Otherwise, fall back to request IP or connection address
  // Also strip IPv6 prefix (::ffff:) if present
  let ip = (req.ip || req.connection?.remoteAddress || '').replace('::ffff:', '')
  
  // For development, if we get localhost, use a sample IP
  if (ip === '127.0.0.1' || ip === '::1' || !ip) {
    ip = '203.0.113.45' // Sample IP for development
  }
  
  return ip || '0.0.0.0'  // Return default if nothing is found
}

// Fetch JSON data from a URL with a timeout (default: 2500ms)
function fetchJson(url, timeoutMs = 2500) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, (res) => {
      let data = ''
      // Collect data chunks
      res.on('data', (chunk) => (data += chunk))
      // When finished, try parsing JSON
      res.on('end', () => {
        try {
          const json = JSON.parse(data)
          resolve(json)   // Return parsed JSON
        } catch (e) {
          resolve(null)   // If parsing fails, return null
        }
      })
    })
    // Handle network errors
    req.on('error', () => resolve(null))
    // Kill request if it takes longer than timeout
    req.setTimeout(timeoutMs, () => {
      req.destroy()
      resolve(null)
    })
  })
}

// Lookup geographic information about an IP address
async function lookupGeo(ip) {
  // Skip localhost or private IPs — they won't have geo info
  if (!ip || ip === '127.0.0.1' || ip.startsWith('192.168.') || ip.startsWith('10.') || ip.startsWith('172.16.')) {
    return { country: undefined, city: undefined, region: undefined }
  }
  
  // Use ip-api.com to fetch IP details (free endpoint)
  const url = `https://ip-api.com/json/${encodeURIComponent(ip)}?fields=status,country,city,regionName,query`
  const resp = await fetchJson(url)

  // If request fails or status isn’t "success", return undefined values
  if (!resp || resp.status !== 'success') {
    return { country: undefined, city: undefined, region: undefined }
  }

  // Return simplified location info
  return {
    country: resp.country,
    city: resp.city,
    region: resp.regionName,
  }
}

module.exports = { getClientIp, lookupGeo }
