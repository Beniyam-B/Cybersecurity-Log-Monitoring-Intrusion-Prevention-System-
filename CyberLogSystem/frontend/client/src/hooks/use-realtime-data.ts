import { useState, useEffect, useCallback } from 'react'
import { authenticatedRequest } from '@/utils/api'

interface UseRealtimeDataOptions {
  endpoint: string
  interval?: number
  enabled?: boolean
}

export function useRealtimeData<T>({ 
  endpoint, 
  interval = 30000, // 30 seconds default
  enabled = true 
}: UseRealtimeDataOptions) {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    try {
      const result = await authenticatedRequest(endpoint)
      setData(result.data)
      setError(null)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred'
      setError(errorMessage)
      console.error('Error fetching data:', err)
      
      // If authentication expired, redirect to login
      if (errorMessage.includes('Authentication expired')) {
        window.location.href = '/login'
      }
    } finally {
      setLoading(false)
    }
  }, [endpoint])

  // Initial fetch
  useEffect(() => {
    if (enabled) {
      fetchData()
    }
  }, [enabled, fetchData])

  // Set up polling interval
  useEffect(() => {
    if (!enabled || interval <= 0) return

    const intervalId = setInterval(fetchData, interval)
    return () => clearInterval(intervalId)
  }, [enabled, interval, fetchData])

  // Manual refresh function
  const refresh = useCallback(() => {
    setLoading(true)
    setError(null)
    fetchData()
  }, [fetchData])

  return {
    data,
    loading,
    error,
    refresh,
    refetch: fetchData
  }
}
