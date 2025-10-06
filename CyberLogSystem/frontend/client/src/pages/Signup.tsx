import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Shield, Eye, EyeOff } from 'lucide-react'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { CyberCard, CyberCardContent, CyberCardDescription, CyberCardHeader, CyberCardTitle } from '@/components/ui/cyber-card'
import { useToast } from '@/hooks/use-toast'
import { postJson } from '@/utils/api'

interface SignupProps {
  onSignup: (email: string, name: string, role?: 'admin' | 'user', token?: string) => void
}

export default function Signup({ onSignup }: SignupProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    adminSecret: '' // Secret field for admin signup
  })
  const [showAdminField, setShowAdminField] = useState(false) // Toggle for admin field
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    if (formData.password !== formData.confirmPassword) {
      toast({ title: 'Password Mismatch', description: 'Passwords do not match', variant: 'destructive' })
      setIsLoading(false)
      return
    }

    try {
      const signupData: any = { 
        name: formData.name, 
        email: formData.email, 
        password: formData.password 
      }
      
      // Include admin secret if provided
      if (formData.adminSecret) {
        signupData.adminSecret = formData.adminSecret
      }
      
      const res = await postJson<{ token: string; user: { email: string; name: string; role: 'admin' | 'user' } }>(
        '/auth/signup',
        signupData
      )
      // HttpOnly cookies are set automatically by server
      await onSignup(res.user.email, res.user.name, res.user.role, res.token)
      toast({ title: 'Account Created', description: 'Your account has been created successfully!' })
    } catch (err: any) {
      toast({ title: 'Signup Failed', description: err.message || 'Unable to create account', variant: 'destructive' })
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <Shield className="mx-auto h-12 w-12 text-primary glow-primary" />
          <h2 className="mt-6 text-3xl font-bold text-glow">Join CyberGuard</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Create your secure monitoring account
          </p>
        </div>

        <CyberCard>
          <CyberCardHeader>
            <CyberCardTitle>Create Account</CyberCardTitle>
            <CyberCardDescription>
              Sign up to start monitoring your security
            </CyberCardDescription>
          </CyberCardHeader>
          <CyberCardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  name="name"
                  type="text"
                  placeholder="John Doe"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className="cyber-border"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="user@example.com"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  className="cyber-border"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Create a strong password"
                    value={formData.password}
                    onChange={handleInputChange}
                    required
                    className="cyber-border pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  placeholder="Confirm your password"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  required
                  className="cyber-border"
                />
              </div>
              
              {/* Secret Admin Signup Section */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label 
                    htmlFor="adminToggle" 
                    className="text-xs text-muted-foreground cursor-pointer hover:text-primary"
                    onClick={() => setShowAdminField(!showAdminField)}
                  >
                    {showAdminField ? '🔒 Hide Admin Options' : '🔑 Admin Signup'}
                  </Label>
                </div>
                {showAdminField && (
                  <div className="space-y-2 p-3 border rounded-md bg-muted/20">
                    <Label htmlFor="adminSecret" className="text-xs">
                      Admin Secret Code
                    </Label>
                    <Input
                      id="adminSecret"
                      name="adminSecret"
                      type="password"
                      placeholder="Enter admin secret code"
                      value={formData.adminSecret}
                      onChange={handleInputChange}
                      className="cyber-border text-xs"
                    />
                    <p className="text-xs text-muted-foreground">
                      💡 Leave empty for regular user account. Contact your administrator for the admin secret code.
                    </p>
                  </div>
                )}
              </div>
              
              <Button
                type="submit"
                className="w-full gradient-cyber glow-primary"
                disabled={isLoading}
              >
                {isLoading ? "Creating Account..." : "Create Account"}
              </Button>
            </form>

            <div className="mt-6 text-center text-sm">
              <span className="text-muted-foreground">Already have an account? </span>
              <Link to="/login" className="text-primary hover:underline">
                Sign in
              </Link>
            </div>
          </CyberCardContent>
        </CyberCard>
      </div>
    </div>
  )
}