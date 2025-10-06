import { useState, useEffect } from 'react'
import { User, Camera, Save, ArrowLeft } from 'lucide-react'
import { CyberCard, CyberCardContent, CyberCardDescription, CyberCardHeader, CyberCardTitle } from '@/components/ui/cyber-card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { API_BASE_URL } from '@/utils/api'

// Profile page component for user profile management
export default function Profile() {
  // State for profile data
  const [profile, setProfile] = useState({
    name: '',
    email: '',
    profilePicture: '',
    profile: {
      firstName: '',
      lastName: '',
      phone: '',
      department: '',
      position: '',
      bio: ''
    }
  })
  
  // State for form editing
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState('')
  
  // Form data for editing
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    department: '',
    position: '',
    bio: ''
  })

  // Fetch user profile data
  const fetchProfile = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('auth_token')
      const response = await fetch(`${API_BASE_URL}/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      
      if (!response.ok) {
        throw new Error('Failed to fetch profile')
      }
      
      const data = await response.json()
      setProfile(data.data)
      setFormData({
        firstName: data.data.profile?.firstName || '',
        lastName: data.data.profile?.lastName || '',
        phone: data.data.profile?.phone || '',
        department: data.data.profile?.department || '',
        position: data.data.profile?.position || '',
        bio: data.data.profile?.bio || ''
      })
      setError(null)
    } catch (err) {
      setError(err.message)
      console.error('Error fetching profile:', err)
    } finally {
      setLoading(false)
    }
  }

  // Load profile on component mount
  useEffect(() => {
    fetchProfile()
  }, [])

  // Handle form input changes
  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  // Handle profile picture upload
  const handleProfilePictureChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      setSaving(true)
      
      // Convert file to base64
      const reader = new FileReader()
      reader.onload = async () => {
        const base64String = reader.result as string
        
        const token = localStorage.getItem('auth_token')
        const response = await fetch(`${API_BASE_URL}/profile/picture`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ profilePictureUrl: base64String })
        })
        
        if (!response.ok) {
          throw new Error('Failed to update profile picture')
        }
        
        setProfile(prev => ({ ...prev, profilePicture: base64String }))
        
        // Update user data in localStorage to include profile picture
        const storedUser = localStorage.getItem('auth_user')
        if (storedUser) {
          const userData = JSON.parse(storedUser)
          userData.profilePicture = base64String
          localStorage.setItem('auth_user', JSON.stringify(userData))
        }
        
        setSuccess('Profile picture updated successfully!')
        setTimeout(() => setSuccess(''), 3000)
        setSaving(false)
      }
      
      reader.onerror = () => {
        setError('Failed to read image file')
        setSaving(false)
      }
      
      reader.readAsDataURL(file)
      
    } catch (err) {
      setError(err.message)
      console.error('Error updating profile picture:', err)
      setSaving(false)
    }
  }

  // Handle profile save
  const handleSave = async () => {
    try {
      setSaving(true)
      const token = localStorage.getItem('auth_token')
      const response = await fetch(`${API_BASE_URL}/profile`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          profile: formData
        })
      })
      
      if (!response.ok) {
        throw new Error('Failed to update profile')
      }
      
      const data = await response.json()
      setProfile(prev => ({
        ...prev,
        profile: { ...prev.profile, ...formData }
      }))
      setIsEditing(false)
      setSuccess('Profile updated successfully!')
      setTimeout(() => setSuccess(''), 3000)
      setError(null)
    } catch (err) {
      setError(err.message)
      console.error('Error updating profile:', err)
    } finally {
      setSaving(false)
    }
  }

  // Handle cancel editing
  const handleCancel = () => {
    setIsEditing(false)
    setFormData({
      firstName: profile.profile?.firstName || '',
      lastName: profile.profile?.lastName || '',
      phone: profile.profile?.phone || '',
      department: profile.profile?.department || '',
      position: profile.profile?.position || '',
      bio: profile.profile?.bio || ''
    })
    setError(null)
  }

  // Navigate back to dashboard
  const handleBack = () => {
    window.history.back()
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex justify-center items-center py-12">
          <div className="text-center">
            <User className="h-12 w-12 mx-auto mb-4 animate-pulse text-primary" />
            <p className="text-muted-foreground">Loading profile...</p>
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
          <h1 className="text-3xl font-bold text-glow">My Profile</h1>
          <p className="text-muted-foreground">Manage your account information and settings</p>
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

      <div className="grid gap-6 md:grid-cols-3">
        {/* Profile Picture Section */}
        <div className="md:col-span-1">
          <CyberCard>
            <CyberCardHeader>
              <CyberCardTitle>Profile Picture</CyberCardTitle>
            </CyberCardHeader>
            <CyberCardContent className="text-center space-y-4">
              <div className="relative inline-block">
                <div className="w-32 h-32 rounded-full bg-gradient-to-br from-primary/20 to-primary/40 flex items-center justify-center overflow-hidden">
                  {profile.profilePicture ? (
                    <img 
                      src={profile.profilePicture} 
                      alt="Profile" 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="w-16 h-16 text-primary" />
                  )}
                </div>
                <label className="absolute bottom-0 right-0 bg-primary text-primary-foreground rounded-full p-2 cursor-pointer hover:bg-primary/90 transition-colors">
                  <Camera className="w-4 h-4" />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleProfilePictureChange}
                    className="hidden"
                    disabled={saving}
                  />
                </label>
              </div>
              <p className="text-sm text-muted-foreground">
                Click the camera icon to update your profile picture
              </p>
            </CyberCardContent>
          </CyberCard>
        </div>

        {/* Profile Information Section */}
        <div className="md:col-span-2">
          <CyberCard>
            <CyberCardHeader>
              <CyberCardTitle>Profile Information</CyberCardTitle>
              <CyberCardDescription>
                Update your personal information and preferences
              </CyberCardDescription>
            </CyberCardHeader>
            <CyberCardContent className="space-y-6">
              {/* Basic Info */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  {isEditing ? (
                    <Input
                      id="firstName"
                      value={formData.firstName}
                      onChange={(e) => handleInputChange('firstName', e.target.value)}
                      placeholder="Enter your first name"
                      className="cyber-border"
                    />
                  ) : (
                    <p className="text-sm font-medium">
                      {profile.profile?.firstName || 'Not set'}
                    </p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  {isEditing ? (
                    <Input
                      id="lastName"
                      value={formData.lastName}
                      onChange={(e) => handleInputChange('lastName', e.target.value)}
                      placeholder="Enter your last name"
                      className="cyber-border"
                    />
                  ) : (
                    <p className="text-sm font-medium">
                      {profile.profile?.lastName || 'Not set'}
                    </p>
                  )}
                </div>
              </div>

              {/* Contact Info */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  {isEditing ? (
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      placeholder="Enter your phone number"
                      className="cyber-border"
                    />
                  ) : (
                    <p className="text-sm font-medium">
                      {profile.profile?.phone || 'Not set'}
                    </p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <p className="text-sm font-medium text-muted-foreground">
                    {profile.email}
                  </p>
                  <Badge variant="secondary" className="text-xs">
                    Primary email (cannot be changed)
                  </Badge>
                </div>
              </div>

              {/* Professional Info */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="department">Department</Label>
                  {isEditing ? (
                    <Input
                      id="department"
                      value={formData.department}
                      onChange={(e) => handleInputChange('department', e.target.value)}
                      placeholder="Enter your department"
                      className="cyber-border"
                    />
                  ) : (
                    <p className="text-sm font-medium">
                      {profile.profile?.department || 'Not set'}
                    </p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="position">Position</Label>
                  {isEditing ? (
                    <Input
                      id="position"
                      value={formData.position}
                      onChange={(e) => handleInputChange('position', e.target.value)}
                      placeholder="Enter your position"
                      className="cyber-border"
                    />
                  ) : (
                    <p className="text-sm font-medium">
                      {profile.profile?.position || 'Not set'}
                    </p>
                  )}
                </div>
              </div>

              {/* Bio */}
              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                {isEditing ? (
                  <Textarea
                    id="bio"
                    value={formData.bio}
                    onChange={(e) => handleInputChange('bio', e.target.value)}
                    placeholder="Tell us about yourself..."
                    rows={4}
                    className="cyber-border"
                  />
                ) : (
                  <p className="text-sm text-muted-foreground">
                    {profile.profile?.bio || 'No bio added yet'}
                  </p>
                )}
              </div>

              {/* Action Buttons */}
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
                    Edit Profile
                  </Button>
                )}
              </div>
            </CyberCardContent>
          </CyberCard>
        </div>
      </div>
      </div>
    </div>
  )
}