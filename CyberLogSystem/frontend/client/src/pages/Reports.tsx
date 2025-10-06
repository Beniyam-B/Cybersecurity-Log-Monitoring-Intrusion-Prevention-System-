import { useState, useEffect } from 'react'
import { Download, FileText, Calendar, Filter, RefreshCw, ArrowLeft } from 'lucide-react'
import { CyberCard, CyberCardContent, CyberCardDescription, CyberCardHeader, CyberCardTitle } from '@/components/ui/cyber-card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { authenticatedRequest } from '@/utils/api'

interface Report {
  _id: string
  title: string
  type: string
  dateRange: string
  generatedAt: string
  status: string
  size: string
  downloadUrl?: string
}

interface ReportsProps {
  userRole?: 'admin' | 'user'
}

export default function Reports({ userRole = 'user' }: ReportsProps) {
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [reportType, setReportType] = useState('security')
  const [dateRange, setDateRange] = useState('7')
  const [customTitle, setCustomTitle] = useState('')

  const fetchReports = async () => {
    setLoading(true)
    try {
      const data = await authenticatedRequest('/reports')
      if (data.success) {
        setReports(data.data)
      }
    } catch (error) {
      console.error('Error fetching reports:', error)
      if (error.message?.includes('Authentication expired')) {
        window.location.href = '/login'
        return
      }
      // Fallback sample reports
      setReports([
        {
          _id: '1',
          title: 'Security Summary Report',
          type: 'security',
          dateRange: 'Last 7 days',
          generatedAt: new Date().toLocaleString(),
          status: 'completed',
          size: '2.3 MB'
        },
        {
          _id: '2',
          title: 'User Activity Report',
          type: 'activity',
          dateRange: 'Last 30 days',
          generatedAt: new Date(Date.now() - 24*60*60*1000).toLocaleString(),
          status: 'completed',
          size: '1.8 MB'
        }
      ])
    } finally {
      setLoading(false)
    }
  }

  const generateReport = async () => {
    setGenerating(true)
    try {
      const data = await authenticatedRequest('/reports/generate', {
        method: 'POST',
        body: JSON.stringify({
          type: reportType,
          dateRange: parseInt(dateRange),
          title: customTitle || `${reportType.charAt(0).toUpperCase() + reportType.slice(1)} Report`
        })
      })
      if (data.success) {
        fetchReports()
        setCustomTitle('')
      }
    } catch (error) {
      console.error('Error generating report:', error)
      if (error.message?.includes('Authentication expired')) {
        window.location.href = '/login'
      }
    } finally {
      setGenerating(false)
    }
  }

  const downloadReport = async (reportId: string, title: string) => {
    try {
      const response = await fetch(`http://localhost:8080/api/reports/${reportId}/download`, {
        credentials: 'include'
      })
      
      if (response.status === 401) {
        window.location.href = '/login'
        return
      }
      
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${title}.pdf`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      } else {
        throw new Error('Download failed')
      }
    } catch (error) {
      console.error('Error downloading report:', error)
      alert('Failed to download report. Please try again.')
    }
  }

  useEffect(() => {
    fetchReports()
  }, [])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'gradient-success'
      case 'generating': return 'bg-warning'
      case 'failed': return 'gradient-danger'
      default: return 'bg-muted'
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'security': return '🛡️'
      case 'activity': return '📊'
      case 'compliance': return '📋'
      default: return '📄'
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-8">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <Button variant="outline" onClick={() => window.history.length > 1 ? window.history.back() : window.location.href = '/dashboard'} className="cyber-border">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-glow">{userRole === 'admin' ? 'System Reports' : 'Security Reports'}</h1>
            <p className="text-muted-foreground">{userRole === 'admin' ? 'Generate and manage system-wide security reports' : 'Generate and manage security compliance reports'}</p>
          </div>
        </div>
        <Button onClick={fetchReports} disabled={loading} className="cyber-border">
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <Tabs defaultValue="generate" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="generate">Generate Report</TabsTrigger>
          <TabsTrigger value="history">Report History</TabsTrigger>
        </TabsList>

        <TabsContent value="generate" className="space-y-4">
          <CyberCard>
            <CyberCardHeader>
              <CyberCardTitle>Generate New Report</CyberCardTitle>
              <CyberCardDescription>
                Create comprehensive security and compliance reports
              </CyberCardDescription>
            </CyberCardHeader>
            <CyberCardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Report Type</label>
                  <Select value={reportType} onValueChange={setReportType}>
                    <SelectTrigger className="cyber-border">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="security">Security Summary</SelectItem>
                      <SelectItem value="activity">User Activity</SelectItem>
                      <SelectItem value="compliance">Compliance Audit</SelectItem>
                      <SelectItem value="threats">Threat Analysis</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Date Range</label>
                  <Select value={dateRange} onValueChange={setDateRange}>
                    <SelectTrigger className="cyber-border">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Last 24 hours</SelectItem>
                      <SelectItem value="7">Last 7 days</SelectItem>
                      <SelectItem value="30">Last 30 days</SelectItem>
                      <SelectItem value="90">Last 90 days</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Custom Title (Optional)</label>
                <Input
                  placeholder="Enter custom report title..."
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  className="cyber-border"
                />
              </div>

              <Button 
                onClick={generateReport} 
                disabled={generating}
                className="w-full cyber-border"
              >
                {generating ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Generating Report...
                  </>
                ) : (
                  <>
                    <FileText className="h-4 w-4 mr-2" />
                    Generate Report
                  </>
                )}
              </Button>
            </CyberCardContent>
          </CyberCard>

          {/* Report Preview */}
          <CyberCard>
            <CyberCardHeader>
              <CyberCardTitle>Report Preview</CyberCardTitle>
            </CyberCardHeader>
            <CyberCardContent>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Type:</span>
                  <span className="font-medium">{reportType.charAt(0).toUpperCase() + reportType.slice(1)} Report</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Date Range:</span>
                  <span className="font-medium">Last {dateRange} {dateRange === '1' ? 'day' : 'days'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Title:</span>
                  <span className="font-medium">
                    {customTitle || `${reportType.charAt(0).toUpperCase() + reportType.slice(1)} Report`}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Format:</span>
                  <span className="font-medium">PDF</span>
                </div>
              </div>
            </CyberCardContent>
          </CyberCard>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <CyberCard>
            <CyberCardHeader>
              <CyberCardTitle>Report History</CyberCardTitle>
              <CyberCardDescription>
                Previously generated reports and downloads
              </CyberCardDescription>
            </CyberCardHeader>
            <CyberCardContent>
              {loading ? (
                <div className="flex justify-center items-center py-12">
                  <RefreshCw className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Report</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Date Range</TableHead>
                      <TableHead>Generated</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Size</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reports.length > 0 ? (
                      reports.map((report) => (
                        <TableRow key={report._id}>
                          <TableCell className="font-medium">
                            <div className="flex items-center space-x-2">
                              <span>{getTypeIcon(report.type)}</span>
                              <span>{report.title}</span>
                              {userRole === 'admin' && report.generatedBy && (
                                <span className="text-xs text-muted-foreground">({report.generatedBy.email})</span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {report.type.charAt(0).toUpperCase() + report.type.slice(1)}
                            </Badge>
                          </TableCell>
                          <TableCell>{report.dateRange}</TableCell>
                          <TableCell>{report.generatedAt}</TableCell>
                          <TableCell>
                            <Badge className={getStatusColor(report.status)}>
                              {report.status.charAt(0).toUpperCase() + report.status.slice(1)}
                            </Badge>
                          </TableCell>
                          <TableCell>{report.size}</TableCell>
                          <TableCell>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => downloadReport(report._id, report.title)}
                              disabled={report.status !== 'completed'}
                              className="cyber-border"
                            >
                              <Download className="h-4 w-4 mr-2" />
                              Download
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                          No reports generated yet
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </CyberCardContent>
          </CyberCard>
        </TabsContent>
      </Tabs>
    </div>
  )
}