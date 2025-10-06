import { useState, useEffect } from 'react'
import {
  Settings as SettingsIcon,
  ArrowLeft,
  Save,
  Shield,
  Palette,
  Key,
} from 'lucide-react'
import {
  CyberCard,
  CyberCardContent,
  CyberCardDescription,
  CyberCardHeader,
  CyberCardTitle,
} from '@/components/ui/cyber-card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { authenticatedRequest } from '@/utils/api'
import { useTheme } from '@/context/ThemeContext'

type SettingsData = {
  preferences: {
    theme: 'light' | 'dark' | 'auto'
    notifications: {
      email: boolean
      security: boolean
    }
  }
  security: {
    twoFactorEnabled: boolean
    lastPasswordChange: string | null
  }
}

const DEFAULT_SETTINGS: SettingsData = {
  preferences: {
    theme: 'auto',
    notifications: {
      email: true,
      security: true,
    },
  },
  security: {
    twoFactorEnabled: false,
    lastPasswordChange: null,
  },
}

export default function Settings() {
  const { theme, setTheme } = useTheme()
  const [settings, setSettings] = useState<SettingsData>(DEFAULT_SETTINGS)
  const [formData, setFormData] = useState({
    emailNotifications: true,
    securityNotifications: true,
  })
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState('')
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })
  const [showPasswordForm, setShowPasswordForm] = useState(false)

  // Fetch settings from API
  const fetchSettings = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await authenticatedRequest('/profile/settings')
      if (data.success && data.data) {
        const incoming = data.data as SettingsData
        setSettings({
          preferences: {
            theme: incoming.preferences?.theme || 'auto',
            notifications: {
              email: incoming.preferences?.notifications?.email ?? true,
              security: incoming.preferences?.notifications?.security ?? true,
            },
          },
          security: {
            twoFactorEnabled: incoming.security?.twoFactorEnabled ?? false,
            lastPasswordChange: incoming.security?.lastPasswordChange ?? null,
          },
        })
        setFormData({
          emailNotifications: incoming.preferences?.notifications?.email ?? true,
          securityNotifications: incoming.preferences?.notifications?.security ?? true,
        })
        // Don't override current theme - let user control it via UI
      } else {
        throw new Error(data.message || 'Failed to fetch settings')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      console.error('Error fetching settings:', err)
      if (err.message?.includes('Authentication expired')) {
        window.location.href = '/login'
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSettings()
  }, [])

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handlePasswordChange = (field: string, value: string) => {
    setPasswordForm(prev => ({ ...prev, [field]: value }))
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      setError(null)
      const data = await authenticatedRequest('/profile', {
        method: 'PUT',
        body: JSON.stringify({
          preferences: {
            theme,
            notifications: {
              email: formData.emailNotifications,
              security: formData.securityNotifications,
            },
          },
        }),
      })
      if (data.success) {
        setSettings(prev => ({
          ...prev,
          preferences: {
            theme,
            notifications: {
              email: formData.emailNotifications,
              security: formData.securityNotifications,
            },
          },
        }))
        setIsEditing(false)
        setSuccess('Settings updated successfully!')
        setTimeout(() => setSuccess(''), 3000)
      } else {
        throw new Error(data.message || 'Failed to update settings')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      console.error('Error updating settings:', err)
      if (err.message?.includes('Authentication expired')) {
        window.location.href = '/login'
      }
    } finally {
      setSaving(false)
    }
  }

  const handlePasswordChangeSubmit = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setError('New passwords do not match')
      return
    }
    if (passwordForm.newPassword.length < 6) {
      setError('New password must be at least 6 characters long')
      return
    }
    if (!passwordForm.currentPassword) {
      setError('Current password is required')
      return
    }

    try {
      setSaving(true)
      setError(null)
      const data = await authenticatedRequest('/profile/password', {
        method: 'PUT',
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
        }),
      })
      if (data.success) {
        setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
        setShowPasswordForm(false)
        setSuccess('Password changed successfully!')
        setTimeout(() => setSuccess(''), 3000)
      } else {
        throw new Error(data.message || 'Failed to change password')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      console.error('Error changing password:', err)
      if (err.message?.includes('Authentication expired')) {
        window.location.href = '/login'
      }
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    setIsEditing(false)
    setFormData({
      emailNotifications: settings.preferences.notifications.email,
      securityNotifications: settings.preferences.notifications.security,
    })
    setTheme(settings.preferences.theme)
    setError(null)
  }

  const handleBack = () => {
    if (window.history.length > 1) {
      window.history.back()
    } else {
      window.location.href = '/dashboard'
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex justify-center items-center py-12">
          <div className="text-center">
            <SettingsIcon className="h-12 w-12 mx-auto mb-4 animate-pulse text-primary" />
            <p className="text-muted-foreground">Loading settings...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Button variant="outline" onClick={handleBack} className="cyber-border">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-glow">Account Settings</h1>
          <p className="text-muted-foreground">Manage your account preferences and security settings</p>
        </div>
      </div>

      {/* Success/Error Messages */}
      {success && (
        <div className="bg-success/10 border border-success rounded-lg p-4">
          <p className="text-success">{success}</p>
        </div>
      )}

      {error && (
        <div className="bg-destructive/10 border border-destructive rounded-lg p-4">
          <p className="text-destructive">Error: {error}</p>
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {/* Preferences */}
        <div>
          <CyberCard>
            <CyberCardHeader>
              <CyberCardTitle className="flex items-center">
                <Palette className="h-5 w-5 mr-2" />
                Preferences
              </CyberCardTitle>
              <CyberCardDescription>Customize your experience and notifications</CyberCardDescription>
            </CyberCardHeader>
            <CyberCardContent className="space-y-6">
              {/* Theme */}
              <div className="space-y-2">
                <Label htmlFor="theme">Theme</Label>
                {isEditing ? (
                  <Select
                    value={theme}
                    onValueChange={(value: 'light' | 'dark' | 'auto') => setTheme(value)}
                  >
                    <SelectTrigger className="cyber-border">
                      <SelectValue placeholder="Select theme" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">Light</SelectItem>
                      <SelectItem value="dark">Dark</SelectItem>
                      <SelectItem value="auto">Auto (System)</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <p className="text-sm font-medium capitalize">{theme}</p>
                )}
              </div>

              {/* Notifications */}
              <div className="space-y-4">
                <Label>Notifications</Label>
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label htmlFor="email-notifications" className="text-sm font-medium">
                      Email Notifications
                    </Label>
                    <p className="text-xs text-muted-foreground">Receive updates via email</p>
                  </div>
                  {isEditing ? (
                    <Switch
                      id="email-notifications"
                      checked={formData.emailNotifications}
                      onCheckedChange={checked => handleInputChange('emailNotifications', checked)}
                    />
                  ) : (
                    <Badge variant={formData.emailNotifications ? 'default' : 'secondary'}>
                      {formData.emailNotifications ? 'Enabled' : 'Disabled'}
                    </Badge>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label htmlFor="security-notifications" className="text-sm font-medium">
                      Security Alerts
                    </Label>
                    <p className="text-xs text-muted-foreground">Get notified about security events</p>
                  </div>
                  {isEditing ? (
                    <Switch
                      id="security-notifications"
                      checked={formData.securityNotifications}
                      onCheckedChange={checked => handleInputChange('securityNotifications', checked)}
                    />
                  ) : (
                    <Badge variant={formData.securityNotifications ? 'default' : 'secondary'}>
                      {formData.securityNotifications ? 'Enabled' : 'Disabled'}
                    </Badge>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end space-x-2 pt-4">
                {isEditing ? (
                  <>
                    <Button variant="outline" onClick={handleCancel} className="cyber-border">
                      Cancel
                    </Button>
                    <Button onClick={handleSave} disabled={saving} className="cyber-border">
                      <Save className="h-4 w-4 mr-2" />
                      {saving ? 'Saving...' : 'Save Changes'}
                    </Button>
                  </>
                ) : (
                  <Button onClick={() => setIsEditing(true)} className="cyber-border">
                    Edit Preferences
                  </Button>
                )}
              </div>
            </CyberCardContent>
          </CyberCard>
        </div>

        {/* Security Section */}
        <div>
          <CyberCard>
            <CyberCardHeader>
              <CyberCardTitle className="flex items-center">
                <Shield className="h-5 w-5 mr-2" />
                Security
              </CyberCardTitle>
              <CyberCardDescription>Manage your account security settings</CyberCardDescription>
            </CyberCardHeader>
            <CyberCardContent className="space-y-6">
              {/* Two-Factor */}
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label className="text-sm font-medium">Two-Factor Authentication</Label>
                  <p className="text-xs text-muted-foreground">Add an extra layer of security</p>
                </div>
                <Badge variant={settings.security.twoFactorEnabled ? 'default' : 'secondary'}>
                  {settings.security.twoFactorEnabled ? 'Enabled' : 'Disabled'}
                </Badge>
              </div>

              {/* Last Password Change */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Last Password Change</Label>
                <p className="text-sm text-muted-foreground">
                  {settings.security.lastPasswordChange
                    ? new Date(settings.security.lastPasswordChange).toLocaleDateString()
                    : 'Never'}
                </p>
              </div>

              {/* Change Password */}
              <Button
                onClick={() => setShowPasswordForm(!showPasswordForm)}
                variant="outline"
                className="cyber-border w-full"
              >
                <Key className="h-4 w-4 mr-2" />
                Change Password
              </Button>

              {showPasswordForm && (
                <div className="space-y-4 p-4 border rounded-lg bg-muted/20">
                  <div className="space-y-2">
                    <Label htmlFor="current-password">Current Password</Label>
                    <Input
                      id="current-password"
                      type="password"
                      value={passwordForm.currentPassword}
                      onChange={e => handlePasswordChange('currentPassword', e.target.value)}
                      placeholder="Enter current password"
                      className="cyber-border"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="new-password">New Password</Label>
                    <Input
                      id="new-password"
                      type="password"
                      value={passwordForm.newPassword}
                      onChange={e => handlePasswordChange('newPassword', e.target.value)}
                      placeholder="Enter new password"
                      className="cyber-border"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirm-password">Confirm New Password</Label>
                    <Input
                      id="confirm-password"
                      type="password"
                      value={passwordForm.confirmPassword}
                      onChange={e => handlePasswordChange('confirmPassword', e.target.value)}
                      placeholder="Confirm new password"
                      className="cyber-border"
                    />
                  </div>

                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={() => setShowPasswordForm(false)} className="cyber-border">
                      Cancel
                    </Button>
                    <Button onClick={handlePasswordChangeSubmit} disabled={saving} className="cyber-border">
                      <Key className="h-4 w-4 mr-2" />
                      {saving ? 'Changing...' : 'Change Password'}
                    </Button>
                  </div>
                </div>
              )}
            </CyberCardContent>
          </CyberCard>
        </div>
      </div>
      </div>
    </div>
  )
}
