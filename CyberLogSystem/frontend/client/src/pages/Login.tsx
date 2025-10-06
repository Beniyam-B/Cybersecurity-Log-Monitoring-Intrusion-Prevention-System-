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

interface LoginProps {
  onLogin: (email: string, role: 'admin' | 'user', token?: string, rememberMe?: boolean) => void
}

export default function Login({ onLogin }: LoginProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [failedAttempts, setFailedAttempts] = useState(0)
  const [rememberMe, setRememberMe] = useState(false)
  const { toast } = useToast()
  
  const maxAttempts = 5
  const remainingAttempts = maxAttempts - failedAttempts

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      const res = await postJson<{ token: string; user: { email: string; name: string; role: 'admin' | 'user' } }>(
        '/auth/login',
        { email, password }
      )
      // HttpOnly cookies are set automatically by server
      await onLogin(res.user.email, res.user.role, res.token, rememberMe)
      toast({ title: 'Login Successful', description: `Welcome back, ${res.user.role}!` })
    } catch (err: any) {
      setFailedAttempts(prev => prev + 1)
      toast({ title: 'Login Failed', description: err.message || 'Invalid credentials', variant: 'destructive' })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <Shield className="mx-auto h-12 w-12 text-primary glow-primary" />
          <h2 className="mt-6 text-3xl font-bold text-glow">CyberGuard Login</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Secure access to your monitoring dashboard
          </p>
        </div>

        <CyberCard>
          <CyberCardHeader>
            <CyberCardTitle>Sign In</CyberCardTitle>
            <CyberCardDescription>
              Enter your credentials to access the system
            </CyberCardDescription>
          </CyberCardHeader>
          <CyberCardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="user@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="cyber-border"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
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
              
              <div className="flex items-center space-x-2">
                <input
                  id="remember"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded border-gray-300"
                />
                <Label htmlFor="remember" className="text-sm">
                  Remember me
                </Label>
              </div>
              
              <Button
                type="submit"
                className="w-full gradient-cyber glow-primary"
                disabled={isLoading}
              >
                {isLoading ? "Signing In..." : "Sign In"}
              </Button>
            </form>
            
            {failedAttempts > 0 && remainingAttempts > 0 && (
              <div className="mt-4 text-center text-sm text-warning">
                ⚠️ {remainingAttempts} attempt{remainingAttempts !== 1 ? 's' : ''} remaining before account lockout
              </div>
            )}
            
            {remainingAttempts <= 0 && (
              <div className="mt-4 text-center text-sm text-destructive">
                🔒 Account temporarily locked. Please try again later.
              </div>
            )}

            <div className="mt-6 text-center text-sm">
              <span className="text-muted-foreground">Don't have an account? </span>
              <Link to="/signup" className="text-primary hover:underline">
                Sign up
              </Link>
            </div>
          </CyberCardContent>
        </CyberCard>
      </div>
    </div>
  )
}