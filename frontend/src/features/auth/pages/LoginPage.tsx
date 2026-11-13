import { useState, useEffect } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { useAuth } from '../AuthContext'
import { apiClient } from '../../../api/client'
import { Lock, User, ArrowRight, AlertCircle, Sparkles } from 'lucide-react'
import { GlassCard } from '../../../components/common/GlassCard'
import { Button } from '../../../components/common/Button'
import { Input } from '../../../components/common/Input'

export function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const { login, isAuthenticated } = useAuth()

  const urlError = new URLSearchParams(location.search).get('error')
  const oauthError = urlError === 'oauth2_missing_id' 
    ? 'Failed to retrieve identity from Google.' 
    : urlError === 'oauth2_failure' 
    ? 'Google authentication failed or was cancelled.' 
    : ''
  const displayError = error || oauthError

  useEffect(() => {
    if (isAuthenticated) {
      const from = location.state?.from
      if (from) {
        navigate(`${from.pathname}${from.search}${from.hash}`)
      } else {
        navigate('/')
      }
    }
  }, [isAuthenticated, navigate, location])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await apiClient.post('/auth/login', { username, password })
      const data = response as any
      login({ id: data.userId, username: data.username }, data.token)

      const from = location.state?.from
      if (from) {
        navigate(`${from.pathname}${from.search}${from.hash}`)
      } else {
        navigate('/')
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid username or password')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleLogin = () => {
    if (location.state?.from) {
      sessionStorage.setItem('oauth_redirect', JSON.stringify(location.state.from))
    }
    window.location.href = '/oauth2/authorization/google'
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F4F7FA] p-4 text-[#172B3A]">
      <div className="w-full max-w-md">
        <GlassCard padding="lg" className="border-[#648296]/20 shadow-md space-y-6">
          {/* Brand Header */}
          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded-xl bg-[#168AAD] text-white flex items-center justify-center mx-auto shadow-sm">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-2xl font-extrabold text-[#172B3A] tracking-tight">
              Sign in to MeetingMind
            </h1>
            <p className="text-xs text-[#5A6E7F]">
              Enter your credentials or authenticate via Google OAuth.
            </p>
          </div>

          {displayError && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
              <span>{displayError}</span>
            </div>
          )}

          {/* Form */}
          <form className="space-y-4" onSubmit={handleSubmit}>
            <Input
              label="Username or Email"
              icon={User}
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. user or user@company.com"
            />

            <Input
              label="Password"
              icon={Lock}
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />

            <Button
              type="submit"
              variant="primary"
              className="w-full"
              loading={loading}
              icon={ArrowRight}
              iconPosition="right"
            >
              Sign In
            </Button>
          </form>

          {/* Google OAuth Option */}
          <div className="space-y-4">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[#648296]/20" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-[#718096]">Or continue with</span>
              </div>
            </div>

            <Button
              type="button"
              variant="secondary"
              className="w-full gap-2.5"
              onClick={handleGoogleLogin}
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Sign in with Google</span>
            </Button>
          </div>

          <div className="pt-2 text-center text-xs text-[#5A6E7F]">
            Don't have an account?{' '}
            <Link to="/register" className="font-semibold text-[#168AAD] hover:underline">
              Create account
            </Link>
          </div>
        </GlassCard>
      </div>
    </div>
  )
}
