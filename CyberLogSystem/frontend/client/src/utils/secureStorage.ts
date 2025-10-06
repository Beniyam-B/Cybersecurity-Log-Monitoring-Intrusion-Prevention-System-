/**
 * Secure Token Storage Manager
 * Provides multiple secure alternatives to localStorage for JWT tokens
 */

/**
 * Storage Options (from most to least secure):
 * 1. HttpOnly Cookies - Most secure, server-managed, immune to XSS
 * 2. Memory Storage - Secure, lost on page refresh
 * 3. SessionStorage - Secure, survives refresh but not browser close  
 * 4. Encrypted LocalStorage - Persistent but encrypted
 * 5. LocalStorage - Least secure fallback
 */

class SecureTokenStorage {
  private static readonly TOKEN_KEY = 'auth_token'
  private static readonly USER_KEY = 'auth_user'
  
  // Memory storage (most secure)
  private static memoryToken: string | null = null
  private static memoryUser: any = null
  
  /**
   * Store token securely with httpOnly cookies as primary method
   * @param token JWT token
   * @param user User data
   * @param options Storage preferences
   */
  static async setToken(token: string, user: any, options: {
    persistent?: boolean,     // Use persistent cookies
    useMemoryOnly?: boolean,  // Fallback to memory only
    useCookies?: boolean      // Use httpOnly cookies (default: true)
  } = { useCookies: true }) {
    
    // Option 1: HttpOnly Cookies (most secure)
    if (options.useCookies !== false) {
      try {
        await CookieTokenStorage.setTokenViaCookie(token, user, options.persistent)
        // Cache in memory for immediate access
        this.memoryToken = token
        this.memoryUser = user
        return
      } catch (error) {
        console.warn('Cookie storage failed, falling back to alternative storage:', error)
      }
    }
    
    if (options.useMemoryOnly) {
      // Option 2: Memory only
      this.memoryToken = token
      this.memoryUser = user
      return
    }
    
    // Option 3: Fallback to session/local storage
    if (options.persistent) {
      const encryptedToken = this.encrypt(token)
      const encryptedUser = this.encrypt(JSON.stringify(user))
      localStorage.setItem(this.TOKEN_KEY, encryptedToken)
      localStorage.setItem(this.USER_KEY, encryptedUser)
    } else {
      sessionStorage.setItem(this.TOKEN_KEY, token)
      sessionStorage.setItem(this.USER_KEY, JSON.stringify(user))
    }
    
    // Cache in memory
    this.memoryToken = token
    this.memoryUser = user
  }
  
  /**
   * Retrieve token from secure storage
   * Priority: Memory > HttpOnly Cookie > SessionStorage > LocalStorage
   */
  static getToken(): string | null {
    // Try memory first (fastest and most secure)
    if (this.memoryToken) {
      return this.memoryToken
    }
    
    // Try sessionStorage
    const sessionToken = sessionStorage.getItem(this.TOKEN_KEY)
    if (sessionToken) {
      this.memoryToken = sessionToken // Cache in memory
      return sessionToken
    }
    
    // Try localStorage (check if encrypted)
    const localToken = localStorage.getItem(this.TOKEN_KEY)
    if (localToken) {
      try {
        // Try to decrypt if it looks encrypted
        const decryptedToken = this.decrypt(localToken)
        this.memoryToken = decryptedToken
        return decryptedToken
      } catch {
        // Not encrypted, use as-is
        this.memoryToken = localToken
        return localToken
      }
    }
    
    return null
  }
  
  /**
   * Retrieve user data from secure storage
   * Priority: Memory > Cookies > SessionStorage > LocalStorage
   */
  static getUser(): any {
    if (this.memoryUser) {
      return this.memoryUser
    }
    
    // Try cookies (auth_user cookie set by server)
    try {
      const cookieUser = this.getCookie('auth_user')
      if (cookieUser) {
        this.memoryUser = JSON.parse(cookieUser)
        return this.memoryUser
      }
    } catch {}
    
    // Try sessionStorage
    const sessionUser = sessionStorage.getItem(this.USER_KEY)
    if (sessionUser) {
      try {
        this.memoryUser = JSON.parse(sessionUser)
        return this.memoryUser
      } catch {}
    }
    
    // Try localStorage
    const localUser = localStorage.getItem(this.USER_KEY)
    if (localUser) {
      try {
        // Try to decrypt if encrypted
        const decryptedUser = this.decrypt(localUser)
        this.memoryUser = JSON.parse(decryptedUser)
        return this.memoryUser
      } catch {
        // Not encrypted
        try {
          this.memoryUser = JSON.parse(localUser)
          return this.memoryUser
        } catch {}
      }
    }
    
    return null
  }
  
  /**
   * Clear all stored tokens and user data
   */
  static async clearAll() {
    // Clear memory
    this.memoryToken = null
    this.memoryUser = null
    
    // Clear httpOnly cookies
    try {
      await CookieTokenStorage.clearCookie()
    } catch (error) {
      console.warn('Failed to clear cookies:', error)
    }
    
    // Clear sessionStorage
    sessionStorage.removeItem(this.TOKEN_KEY)
    sessionStorage.removeItem(this.USER_KEY)
    
    // Clear localStorage
    localStorage.removeItem(this.TOKEN_KEY)
    localStorage.removeItem(this.USER_KEY)
  }
  
  /**
   * Check if user is authenticated
   */
  static isAuthenticated(): boolean {
    return !!this.getToken()
  }
  
  /**
   * Simple encryption for localStorage (basic XOR cipher)
   * Note: This is basic obfuscation, not cryptographically secure
   */
  private static encrypt(text: string): string {
    const key = 'CyberGuardSecure2024' // Simple key
    let result = ''
    for (let i = 0; i < text.length; i++) {
      result += String.fromCharCode(
        text.charCodeAt(i) ^ key.charCodeAt(i % key.length)
      )
    }
    return btoa(result) // Base64 encode
  }
  
  /**
   * Simple decryption for localStorage
   */
  private static decrypt(encryptedText: string): string {
    const key = 'CyberGuardSecure2024'
    const text = atob(encryptedText) // Base64 decode
    let result = ''
    for (let i = 0; i < text.length; i++) {
      result += String.fromCharCode(
        text.charCodeAt(i) ^ key.charCodeAt(i % key.length)
      )
    }
    return result
  }
  
  /**
   * Get cookie value by name (client-side readable cookies only)
   */
  private static getCookie(name: string): string | null {
    if (typeof document === 'undefined') return null
    
    const value = `; ${document.cookie}`
    const parts = value.split(`; ${name}=`)
    if (parts.length === 2) {
      return parts.pop()?.split(';').shift() || null
    }
    return null
  }
}

/**
 * Cookie-based storage for httpOnly cookies (requires server support)
 */
class CookieTokenStorage {
  /**
   * Set token in httpOnly cookie (server-side only)
   * This method just makes the request, actual cookie setting happens server-side
   */
  static async setTokenViaCookie(token: string, user: any, persistent: boolean = false) {
    const API_BASE_URL = 'http://localhost:8080'
    const response = await fetch(`${API_BASE_URL}/api/auth/set-cookie`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, user, persistent })
    })
    
    if (!response.ok) {
      throw new Error('Failed to set cookie')
    }
  }
  
  /**
   * Clear httpOnly cookie (server-side)
   */
  static async clearCookie() {
    const API_BASE_URL = 'http://localhost:8080'
    const response = await fetch(`${API_BASE_URL}/api/auth/clear-cookie`, {
      method: 'POST',
      credentials: 'include'
    })
    
    if (!response.ok) {
      throw new Error('Failed to clear cookie')
    }
  }
  
  /**
   * Check if cookies are available by making a test request
   */
  static async testCookieSupport(): Promise<boolean> {
    try {
      const API_BASE_URL = 'http://localhost:8080'
      const response = await fetch(`${API_BASE_URL}/api/auth/test-cookie`, {
        credentials: 'include'
      })
      return response.ok
    } catch {
      return false
    }
  }
}

export { SecureTokenStorage, CookieTokenStorage }
export default SecureTokenStorage