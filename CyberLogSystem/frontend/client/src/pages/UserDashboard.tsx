import { useState, useEffect } from 'react'
import { Activity, Clock, Shield, AlertTriangle, RefreshCw } from 'lucide-react'
import { CyberCard, CyberCardContent, CyberCardDescription, CyberCardHeader, CyberCardTitle } from '@/components/ui/cyber-card'
import { SecurityChart } from '@/components/charts/security-chart'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { useRealtimeData } from '@/hooks/use-realtime-data'

interface UserDashboardProps {
  userName: string
  userEmail: string
}

interface DashboardData {
  userStats: Array<{
    name: string
    value: string | number
    icon: string
    status: string
  }>
  activityData: Array<{
    name: string
    value: number
  }>
  loginHistory: Array<{
    date: string
    ip: string
    location: string
    status: string
  }>
}

export default function UserDashboard({ userName, userEmail }: UserDashboardProps) {
  // Use real-time data hook
  const { data: dashboardData, loading, error, refresh } = useRealtimeData<DashboardData>({
    endpoint: '/dashboard/user',
    interval: 30000, // Update every 30 seconds
    enabled: true
  })

  // Default data structure for fallback
  const defaultUserStats = [
    { name: 'Login Attempts', value: 0, icon: 'Activity', status: 'success' },
    { name: 'Security Alerts', value: 0, icon: 'AlertTriangle', status: 'warning' },
    { name: 'Session Duration', value: '0h', icon: 'Clock', status: 'info' },
    { name: 'Security Score', value: '0%', icon: 'Shield', status: 'success' },
  ]

  // Use real data from API or fallback to defaults
  const userStats = dashboardData?.userStats?.length > 0 ? dashboardData.userStats : defaultUserStats
  const activityData = dashboardData?.activityData?.length > 0 ? dashboardData.activityData : []
  const loginHistory = dashboardData?.loginHistory?.length > 0 ? dashboardData.loginHistory : []

  // Handle refresh button click
  const handleRefresh = () => {
    refresh()
  }

  return (
    <div className="container mx-auto p-6 space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-glow">Welcome back, {userName}</h1>
          <p className="text-muted-foreground">Your personal security dashboard</p>
        </div>
        <Button 
          onClick={handleRefresh} 
          disabled={loading}
          className="cyber-border"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex justify-center items-center py-12">
          <div className="text-center">
            <RefreshCw className="h-12 w-12 mx-auto mb-4 animate-spin text-primary" />
            <p className="text-muted-foreground">Loading dashboard data...</p>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-destructive/10 border border-destructive rounded-lg p-4">
          <p className="text-destructive">Error: {error}</p>
          <Button onClick={handleRefresh} variant="outline" className="mt-2">
            Try Again
          </Button>
        </div>
      )}



      {/* Stats Cards */}
      {!loading && !error && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {userStats.map((stat, index) => {
            const Icon = getIconComponent(stat.icon)
            return (
              <CyberCard key={index}>
                <CyberCardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CyberCardTitle className="text-sm font-medium">
                    {stat.name}
                  </CyberCardTitle>
                  <Icon className="h-4 w-4 text-muted-foreground" />
                </CyberCardHeader>
                <CyberCardContent>
                  <div className="text-2xl font-bold text-primary">{stat.value}</div>
                </CyberCardContent>
              </CyberCard>
            )
          })}
        </div>
      )}

      {!loading && !error && (
        <div className="grid gap-6 md:grid-cols-2">
          {/* Activity Chart */}
          <CyberCard>
            <CyberCardHeader>
              <CyberCardTitle>Login Activity (Last 7 Days)</CyberCardTitle>
            </CyberCardHeader>
            <CyberCardContent>
              <SecurityChart 
                data={activityData} 
                type="bar" 
                title="" 
              />
            </CyberCardContent>
          </CyberCard>

          {/* Account Overview */}
          <CyberCard>
            <CyberCardHeader>
              <CyberCardTitle>Account Overview</CyberCardTitle>
            </CyberCardHeader>
            <CyberCardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Email:</span>
                  <span className="text-sm font-medium">{userEmail}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Account Type:</span>
                  <Badge variant="secondary">Standard User</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Last Login:</span>
                  <span className="text-sm font-medium">Today, 09:30 AM</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Security Status:</span>
                  <Badge className="gradient-success">Secure</Badge>
                </div>
              </div>
            </CyberCardContent>
          </CyberCard>
        </div>
      )}

      {/* Login History */}
      {!loading && !error && (
        <CyberCard>
          <CyberCardHeader>
            <CyberCardTitle>Recent Login History</CyberCardTitle>
            <CyberCardDescription>
              Your last 5 login attempts
            </CyberCardDescription>
          </CyberCardHeader>
          <CyberCardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date & Time</TableHead>
                  <TableHead>IP Address</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loginHistory.length > 0 ? (
                  loginHistory.map((login, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{login.date}</TableCell>
                      <TableCell>{login.ip}</TableCell>
                      <TableCell>{login.location}</TableCell>
                      <TableCell>
                        <Badge 
                          className={login.status === 'Success' ? 'gradient-success' : 'gradient-danger'}
                        >
                          {login.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                      No login history available
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CyberCardContent>
        </CyberCard>
      )}
    </div>
  )
}

// Helper function to get icon component
function getIconComponent(iconName: string) {
  switch (iconName) {
    case 'Activity':
      return Activity
    case 'AlertTriangle':
      return AlertTriangle
    case 'Clock':
      return Clock
    case 'Shield':
      return Shield
    default:
      return Activity
  }
}