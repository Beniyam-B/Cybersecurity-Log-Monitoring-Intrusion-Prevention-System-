import { useState, useEffect } from 'react'
import { Shield, Users, AlertTriangle, Activity, Eye, Ban, Search, RefreshCw, Edit } from 'lucide-react'
import { CyberCard, CyberCardContent, CyberCardDescription, CyberCardHeader, CyberCardTitle } from '@/components/ui/cyber-card'
import { SecurityChart } from '@/components/charts/security-chart'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { useRealtimeData } from '@/hooks/use-realtime-data'
import { authenticatedRequest } from '@/utils/api'

interface DashboardData {
  systemStats: Array<{
    name: string
    value: string | number
    icon: string
    status: string
  }>
  threatData: Array<{
    name: string
    value: number
  }>
  activityData: Array<{
    name: string
    value: number
  }>
  recentAlerts: Array<{
    time: string
    type: string
    ip: string
    severity: string
    status: string
    user: string
  }>
  userActivity: Array<{
    user: string
    lastLogin: string
    status: string
    role: string
    activityCount: number
  }>
}

export default function AdminDashboard() {
  const [alertSearch, setAlertSearch] = useState('')
  const [users, setUsers] = useState<any[]>([])
  const [logs, setLogs] = useState<any[]>([])
  const [editingUser, setEditingUser] = useState<any>(null)
  const [editForm, setEditForm] = useState({ name: '', email: '', role: 'user' })
  
  // Use real-time data hook
  const { data: dashboardData, loading, error, refresh } = useRealtimeData<DashboardData>({
    endpoint: '/dashboard/admin',
    interval: 30000, // Update every 30 seconds
    enabled: true
  })

  // Fetch users and logs
  const fetchUsers = async () => {
    try {
      const data = await authenticatedRequest('/admin/users')
      if (data.success) setUsers(data.data)
    } catch (error) {
      console.error('Error fetching users:', error)
      if (error.message?.includes('Authentication expired')) {
        window.location.href = '/login'
      }
    }
  }

  const fetchLogs = async () => {
    try {
      const data = await authenticatedRequest('/logs')
      console.log('Logs response:', data)
      if (data.success) {
        setLogs(data.data)
      } else {
        // Fallback sample logs if no real data
        setLogs([
          {
            _id: '1',
            createdAt: new Date().toISOString(),
            action: 'User Login',
            user: { email: 'admin@company.com' },
            ip: '192.168.1.100',
            severity: 'Low'
          },
          {
            _id: '2', 
            createdAt: new Date(Date.now() - 60000).toISOString(),
            action: 'Failed Login Attempt',
            user: null,
            ip: '203.0.113.45',
            severity: 'Medium'
          }
        ])
      }
    } catch (error) {
      console.error('Error fetching logs:', error)
      if (error.message?.includes('Authentication expired')) {
        window.location.href = '/login'
        return
      }
      // Set fallback logs on error
      setLogs([
        {
          _id: '1',
          createdAt: new Date().toISOString(),
          action: 'System Error',
          user: null,
          ip: 'System',
          severity: 'High'
        }
      ])
    }
  }

  const handleSuspendUser = async (userId: string) => {
    try {
      await authenticatedRequest(`/admin/users/${userId}/suspend`, { method: 'PUT' })
      fetchUsers() // Refresh users list
    } catch (error) {
      console.error('Error suspending user:', error)
      if (error.message?.includes('Authentication expired')) {
        window.location.href = '/login'
      }
    }
  }

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return
    }
    try {
      await authenticatedRequest(`/admin/users/${userId}`, { method: 'DELETE' })
      fetchUsers() // Refresh users list
    } catch (error) {
      console.error('Error deleting user:', error)
      if (error.message?.includes('Authentication expired')) {
        window.location.href = '/login'
      }
    }
  }

  const handleEditUser = (user: any) => {
    setEditingUser(user)
    setEditForm({ name: user.name || user.email.split('@')[0], email: user.email, role: user.role })
  }

  const handleSaveEdit = async () => {
    try {
      await authenticatedRequest(`/admin/users/${editingUser._id}`, {
        method: 'PUT',
        body: JSON.stringify(editForm)
      })
      setEditingUser(null)
      fetchUsers()
    } catch (error) {
      console.error('Error updating user:', error)
      if (error.message?.includes('Authentication expired')) {
        window.location.href = '/login'
      }
    }
  }

  const handleResetPassword = async (userId: string, userEmail: string) => {
    if (!confirm(`Reset password for ${userEmail}? A temporary password will be generated.`)) {
      return
    }
    try {
      const data = await authenticatedRequest(`/admin/users/${userId}/reset-password`, { method: 'POST' })
      alert(`Password reset successful!\nTemporary password: ${data.tempPassword}\nUser must change this on next login.`)
    } catch (error) {
      console.error('Error resetting password:', error)
      if (error.message?.includes('Authentication expired')) {
        window.location.href = '/login'
      }
    }
  }

  useEffect(() => {
    fetchUsers()
    fetchLogs()
  }, [])

  // Handle refresh button click
  const handleRefresh = () => {
    refresh()
    fetchUsers()
    fetchLogs()
  }

  // Default data structure for fallback
  const defaultSystemStats = [
    { name: 'Total Users', value: 25, icon: 'Users', status: 'info' },
    { name: 'Security Alerts', value: 8, icon: 'AlertTriangle', status: 'warning' },
    { name: 'Active Sessions', value: 12, icon: 'Activity', status: 'success' },
    { name: 'Blocked IPs', value: 15, icon: 'Ban', status: 'danger' },
  ]

  // Sample data for when no real data exists
  const sampleThreatData = [
    { name: 'Brute Force', value: 12 },
    { name: 'SQL Injection', value: 8 },
    { name: 'XSS Attack', value: 5 },
    { name: 'DDoS', value: 3 }
  ]

  const sampleActivityData = [
    { name: 'Mon', value: 45 },
    { name: 'Tue', value: 52 },
    { name: 'Wed', value: 38 },
    { name: 'Thu', value: 61 },
    { name: 'Fri', value: 47 },
    { name: 'Sat', value: 29 },
    { name: 'Sun', value: 33 }
  ]

  const sampleRecentAlerts = [
    {
      time: new Date(Date.now() - 30 * 60 * 1000).toLocaleTimeString(),
      type: 'Brute Force Attack',
      ip: '203.0.113.45',
      severity: 'High',
      status: 'Active',
      user: 'admin@company.com'
    },
    {
      time: new Date(Date.now() - 2 * 60 * 60 * 1000).toLocaleTimeString(),
      type: 'Suspicious Login',
      ip: '198.51.100.23',
      severity: 'Medium',
      status: 'Resolved',
      user: 'user@company.com'
    }
  ]

  const sampleUserActivity = [
    {
      user: 'admin@company.com',
      lastLogin: new Date(Date.now() - 15 * 60 * 1000).toLocaleString(),
      status: 'Online',
      role: 'admin',
      activityCount: 45
    },
    {
      user: 'user@company.com',
      lastLogin: new Date(Date.now() - 2 * 60 * 60 * 1000).toLocaleString(),
      status: 'Offline',
      role: 'user',
      activityCount: 23
    }
  ]

  // Use real data from API or fallback to defaults
  const systemStats = dashboardData?.systemStats?.length > 0 ? dashboardData.systemStats : defaultSystemStats
  const threatData = dashboardData?.threatData?.length > 0 ? dashboardData.threatData : sampleThreatData
  const activityData = dashboardData?.activityData?.length > 0 ? dashboardData.activityData : sampleActivityData
  const recentAlerts = dashboardData?.recentAlerts?.length > 0 ? dashboardData.recentAlerts : sampleRecentAlerts
  const userActivity = dashboardData?.userActivity?.length > 0 ? dashboardData.userActivity : sampleUserActivity

  // Filter alerts based on search
  const filteredAlerts = recentAlerts.filter(alert => 
    alert.type.toLowerCase().includes(alertSearch.toLowerCase()) ||
    alert.ip.includes(alertSearch) ||
    alert.user.toLowerCase().includes(alertSearch.toLowerCase())
  )

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'Critical': return 'gradient-danger'
      case 'High': return 'bg-warning'
      case 'Medium': return 'bg-accent'
      case 'Low': return 'bg-muted'
      default: return 'bg-muted'
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-glow">Security Operations Center</h1>
          <p className="text-muted-foreground">Advanced threat monitoring and system oversight</p>
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
          {systemStats.map((stat, index) => {
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

      {/* Charts Section */}
      {!loading && !error && (
        <div className="grid gap-6 md:grid-cols-2">
          <CyberCard>
            <CyberCardHeader>
              <CyberCardTitle>Threat Distribution</CyberCardTitle>
            </CyberCardHeader>
            <CyberCardContent>
              <SecurityChart 
                data={threatData} 
                type="pie" 
                title="" 
              />
            </CyberCardContent>
          </CyberCard>

          <CyberCard>
            <CyberCardHeader>
              <CyberCardTitle>System Activity (Last 7 Days)</CyberCardTitle>
            </CyberCardHeader>
            <CyberCardContent>
              <SecurityChart 
                data={activityData} 
                type="bar" 
                title="" 
              />
            </CyberCardContent>
          </CyberCard>
        </div>
      )}

      {/* Detailed Data Tabs */}
      {!loading && !error && (
        <Tabs defaultValue="alerts" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="alerts">Security Alerts</TabsTrigger>
            <TabsTrigger value="users">User Management</TabsTrigger>
            <TabsTrigger value="logs">System Logs</TabsTrigger>
          </TabsList>

        <TabsContent value="alerts" className="space-y-4">
          <CyberCard>
            <CyberCardHeader>
              <CyberCardTitle>Recent Security Alerts</CyberCardTitle>
              <CyberCardDescription>
                Real-time threat detection and response
              </CyberCardDescription>
            </CyberCardHeader>
            <CyberCardContent>
              <div className="flex items-center space-x-2 mb-4">
                <Search className="h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search alerts..."
                  value={alertSearch}
                  onChange={(e) => setAlertSearch(e.target.value)}
                  className="max-w-sm cyber-border"
                />
                <Button variant="outline" className="cyber-border" onClick={() => setAlertSearch('')}>
                  <Eye className="h-4 w-4 mr-2" />
                  Clear
                </Button>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Time</TableHead>
                    <TableHead>Threat Type</TableHead>
                    <TableHead>Source IP</TableHead>
                    <TableHead>Severity</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAlerts.length > 0 ? (
                    filteredAlerts.map((alert, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{alert.time}</TableCell>
                        <TableCell>{alert.type}</TableCell>
                        <TableCell>{alert.ip}</TableCell>
                        <TableCell>
                          <Badge className={getSeverityColor(alert.severity)}>
                            {alert.severity}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{alert.status}</Badge>
                        </TableCell>
                        <TableCell>
                          <Button variant="outline" size="sm">
                            Investigate
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                        No recent alerts available
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CyberCardContent>
          </CyberCard>
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          <CyberCard>
            <CyberCardHeader>
              <CyberCardTitle>User Activity Monitor</CyberCardTitle>
              <CyberCardDescription>
                Monitor and manage user accounts and sessions
              </CyberCardDescription>
            </CyberCardHeader>
            <CyberCardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Last Login</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.length > 0 ? (
                    users.map((user, index) => (
                      <TableRow key={user._id || index}>
                        <TableCell className="font-medium">{user.email}</TableCell>
                        <TableCell>{user.lastLogin ? new Date(user.lastLogin).toLocaleString() : 'Never'}</TableCell>
                        <TableCell>
                          <Badge 
                            className={user.isSuspended ? 'bg-destructive' : 'gradient-success'}
                          >
                            {user.isSuspended ? 'Suspended' : 'Active'}
                          </Badge>
                        </TableCell>
                        <TableCell>{user.role}</TableCell>
                        <TableCell className="space-x-2">
                          <Button variant="outline" size="sm" onClick={() => handleEditUser(user)}>
                            <Edit className="h-4 w-4 mr-1" />
                            Edit
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => handleResetPassword(user._id, user.email)}>
                            Reset Password
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="text-destructive"
                            onClick={() => handleSuspendUser(user._id)}
                            disabled={user.role === 'admin'}
                          >
                            {user.isSuspended ? 'Unsuspend' : 'Suspend'}
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="text-destructive bg-destructive/10"
                            onClick={() => handleDeleteUser(user._id)}
                            disabled={user.role === 'admin'}
                          >
                            Delete
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                        No users found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CyberCardContent>
          </CyberCard>
        </TabsContent>

        <TabsContent value="logs" className="space-y-4">
          <CyberCard>
            <CyberCardHeader>
              <CyberCardTitle>System Activity Logs</CyberCardTitle>
              <CyberCardDescription>
                Comprehensive logging of all system events
              </CyberCardDescription>
            </CyberCardHeader>
            <CyberCardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>IP Address</TableHead>
                    <TableHead>Severity</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.length > 0 ? (
                    logs.slice(0, 10).map((log, index) => (
                      <TableRow key={log._id || index}>
                        <TableCell>{new Date(log.createdAt).toLocaleString()}</TableCell>
                        <TableCell>{log.action}</TableCell>
                        <TableCell>{log.user?.email || 'System'}</TableCell>
                        <TableCell>{log.ip || 'N/A'}</TableCell>
                        <TableCell>
                          <Badge className={getSeverityColor(log.severity)}>
                            {log.severity}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                        No system logs available
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CyberCardContent>
          </CyberCard>
        </TabsContent>
        </Tabs>
      )}

      {/* Edit User Dialog */}
      <Dialog open={!!editingUser} onOpenChange={() => setEditingUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={editForm.name}
                onChange={(e) => setEditForm({...editForm, name: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                value={editForm.email}
                onChange={(e) => setEditForm({...editForm, email: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="role">Role</Label>
              <Select value={editForm.role} onValueChange={(value) => setEditForm({...editForm, role: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingUser(null)}>Cancel</Button>
            <Button onClick={handleSaveEdit}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// Helper function to get icon component
function getIconComponent(iconName: string) {
  switch (iconName) {
    case 'Users':
      return Users
    case 'AlertTriangle':
      return AlertTriangle
    case 'Activity':
      return Activity
    case 'Ban':
      return Ban
    case 'Shield':
      return Shield
    default:
      return Activity
  }
}