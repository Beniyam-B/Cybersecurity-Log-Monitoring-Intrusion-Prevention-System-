import { useState, useEffect } from 'react'
import { Bug, CheckCircle, XCircle, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { checkApiHealth } from '@/utils/api'

export function DebugPanel() {
  const [apiStatus, setApiStatus] = useState<'checking' | 'online' | 'offline'>('checking')
  const [lastCheck, setLastCheck] = useState<Date | null>(null)
  const [error, setError] = useState<string | null>(null)

  const checkStatus = async () => {
    try {
      setApiStatus('checking')
      setError(null)
      
      const isHealthy = await checkApiHealth()
      setApiStatus(isHealthy ? 'online' : 'offline')
      setLastCheck(new Date())
    } catch (err) {
      setApiStatus('offline')
      setError(err instanceof Error ? err.message : 'Unknown error')
      setLastCheck(new Date())
    }
  }

  useEffect(() => {
    checkStatus()
  }, [])

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bug className="h-5 w-5" />
          API Status
        </CardTitle>
        <CardDescription>
          Check backend connectivity
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Status:</span>
          <div className="flex items-center gap-2">
            {apiStatus === 'checking' && <RefreshCw className="h-4 w-4 animate-spin" />}
            {apiStatus === 'online' && <CheckCircle className="h-4 w-4 text-green-500" />}
            {apiStatus === 'offline' && <XCircle className="h-4 w-4 text-red-500" />}
            <span className={`text-sm ${
              apiStatus === 'online' ? 'text-green-600' : 
              apiStatus === 'offline' ? 'text-red-600' : 
              'text-gray-600'
            }`}>
              {apiStatus === 'checking' ? 'Checking...' : 
               apiStatus === 'online' ? 'Online' : 'Offline'}
            </span>
          </div>
        </div>
        
        {lastCheck && (
          <div className="text-xs text-muted-foreground">
            Last checked: {lastCheck.toLocaleTimeString()}
          </div>
        )}
        
        {error && (
          <div className="text-xs text-red-600 bg-red-50 p-2 rounded">
            Error: {error}
          </div>
        )}
        
        <Button onClick={checkStatus} variant="outline" size="sm" className="w-full">
          <RefreshCw className="h-4 w-4 mr-2" />
          Check Again
        </Button>
      </CardContent>
    </Card>
  )
}




