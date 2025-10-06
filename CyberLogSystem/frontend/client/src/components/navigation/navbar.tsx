import { Shield, LogOut, User, Settings, UserCircle, Key, Bell, Palette, Download, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ThemeToggle } from "@/components/ui/theme-toggle"
import { useToast } from "@/hooks/use-toast"

interface NavbarProps {
  userRole: 'admin' | 'user' | null
  userName?: string
  userProfilePicture?: string
  onLogout: () => void
  onNavigateToProfile?: () => void
  onNavigateToSettings?: () => void
  onNavigateToReports?: () => void
}

// API base URL for report downloads
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'

// Generate HTML content for PDF report
const generateReportHTML = (reportData: any, reportType: string, userRole: string) => {
  const { periodLabel, loginHistory = [], securityAlerts = [], activityStats = {}, systemStats = {} } = reportData
  
  return `<!DOCTYPE html><html><head><title>CyberGuard Report</title><style>body{font-family:Arial,sans-serif;margin:20px;color:#333}.header{background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);color:white;padding:20px;text-align:center;margin:-20px -20px 20px -20px}.section{margin:20px 0}.stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:15px;margin:15px 0}.stat-card{background:#f8f9fa;padding:15px;border-radius:8px;text-align:center}.stat-value{font-size:24px;font-weight:bold;color:#667eea}table{width:100%;border-collapse:collapse;margin:15px 0}th,td{padding:8px;text-align:left;border-bottom:1px solid #ddd}th{background-color:#f8f9fa}.footer{text-align:center;margin-top:30px;font-size:12px;color:#666}@media print{body{margin:0}}</style></head><body><div class="header"><h1>🛡️ CyberGuard Security Report</h1><p>${periodLabel || reportType + ' Report'}</p><p>Role: ${userRole}</p></div><div class="section"><h2>${userRole === 'admin' ? 'System Statistics' : 'Activity Summary'}</h2><div class="stats">${userRole === 'admin' ? `<div class="stat-card"><div class="stat-value">${systemStats.totalUsers || 0}</div><div>Total Users</div></div><div class="stat-card"><div class="stat-value">${systemStats.totalAlerts || 0}</div><div>Security Alerts</div></div>` : `<div class="stat-card"><div class="stat-value">${activityStats.totalLogins || 0}</div><div>Total Logins</div></div><div class="stat-card"><div class="stat-value">${activityStats.securityScore || 0}%</div><div>Security Score</div></div>`}</div></div>${loginHistory.length > 0 ? `<div class="section"><h2>Login History</h2><table><tr><th>Date</th><th>IP</th><th>Status</th></tr>${loginHistory.slice(0,10).map(login => `<tr><td>${login.date}</td><td>${login.ip}</td><td>${login.status}</td></tr>`).join('')}</table></div>` : ''}<div class="footer"><p>Generated: ${new Date().toLocaleString()}</p></div></body></html>`
}

export function Navbar({ userRole, userName, userProfilePicture, onLogout, onNavigateToProfile, onNavigateToSettings, onNavigateToReports }: NavbarProps) {
  const { toast } = useToast()

  // Handle report download
  const handleDownloadReport = async (reportType: string = 'weekly') => {
    try {
      // Determine endpoint based on user role
      const endpoint = userRole === 'admin' 
        ? `${API_BASE_URL}/api/reports/admin/${reportType}`
        : `${API_BASE_URL}/api/reports/user/${reportType}`

      // Fetch report data with httpOnly cookies
      const response = await fetch(endpoint, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error('Failed to download report')
      }

      const data = await response.json()
      
      // Generate HTML content for PDF
      const htmlContent = generateReportHTML(data.data, reportType, userRole)
      
      // Create PDF using browser's print functionality
      const printWindow = window.open('', '_blank')
      printWindow.document.write(htmlContent)
      printWindow.document.close()
      printWindow.focus()
      setTimeout(() => {
        printWindow.print()
        printWindow.close()
      }, 500)
      
      return
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      toast({ 
        title: 'Download Started', 
        description: `Your ${reportType} security report is being downloaded.` 
      })
    } catch (error) {
      console.error('Download error:', error)
      toast({ 
        title: 'Download Failed', 
        description: 'Unable to download report. Please try again.', 
        variant: 'destructive' 
      })
    }
  }
  return (
    <header className="border-b bg-card/50 backdrop-blur supports-[backdrop-filter]:bg-card/30">
      <div className="container flex h-16 items-center px-4">
        <div className="flex items-center space-x-2">
          <Shield className="h-8 w-8 text-primary" />
          <span className="text-xl font-bold text-glow">CyberGuard</span>
        </div>
        
        <div className="ml-auto flex items-center space-x-4">
          {/* Theme Toggle - Always visible */}
          <ThemeToggle />
          
          {userRole && (
            <>
              <span className="text-sm text-muted-foreground">
                Welcome, {userName || 'User'}
              </span>
              
              {/* Download Report Button */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="cyber-border">
                    <Download className="mr-2 h-4 w-4" />
                    <span className="hidden sm:inline">Reports</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="cyber-border" align="end">
                  <DropdownMenuLabel>Download Security Report</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => handleDownloadReport('daily')}>
                    📊 Daily Report
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleDownloadReport('weekly')}>
                    📈 Weekly Report
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleDownloadReport('monthly')}>
                    📋 Monthly Report
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* User Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon" className="cyber-border">
                    {userProfilePicture ? (
                      <img 
                        src={userProfilePicture} 
                        alt="Profile" 
                        className="h-6 w-6 rounded-full object-cover"
                      />
                    ) : (
                      <User className="h-4 w-4" />
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel className="flex items-center">
                    <UserCircle className="mr-2 h-4 w-4" />
                    My Account
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={onNavigateToProfile}>
                    <UserCircle className="mr-2 h-4 w-4" />
                    Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={onNavigateToSettings}>
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={onNavigateToReports}>
                    <FileText className="mr-2 h-4 w-4" />
                    Reports
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={onLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          )}
        </div>
      </div>
    </header>
  )
}