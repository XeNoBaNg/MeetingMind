import React, { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../AuthContext'
import { apiClient } from '../../../api/client'
import { Loader2, AlertCircle, Sparkles } from 'lucide-react'
import { GlassCard } from '../../../components/common/GlassCard'
import { Button } from '../../../components/common/Button'

export function OAuthCallback() {
  const location = useLocation()
  const params = new URLSearchParams(location.search)
  const code = params.get('code')

  const [error, setError] = useState(!code ? 'No authorization code found.' : '')
  const navigate = useNavigate()
  const { login } = useAuth()

  const hasExchanged = React.useRef(false)

  useEffect(() => {
    if (!code || hasExchanged.current) {
      return
    }
    hasExchanged.current = true

    const exchangeCode = async () => {
      try {
        const response = await apiClient.post('/auth/oauth-exchange', { code })
        const data = response as any
        login({ id: data.id, username: data.username }, data.token)

        const storedRedirect = sessionStorage.getItem('oauth_redirect')
        if (storedRedirect) {
          sessionStorage.removeItem('oauth_redirect')
          const from = JSON.parse(storedRedirect)
          navigate(`${from.pathname}${from.search}${from.hash}`)
        } else {
          navigate('/')
        }
      } catch (err) {
        console.error('OAuth error', err)
        setError('Failed to authenticate with Google. The link may have expired.')
      }
    }

    exchangeCode()
  }, [code, login, navigate])

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F4F7FA] p-4 text-[#172B3A]">
      <div className="w-full max-w-md">
        <GlassCard padding="lg" className="border-[#648296]/20 shadow-md text-center space-y-6">
          <div className="w-12 h-12 rounded-xl bg-[#168AAD] text-white flex items-center justify-center mx-auto shadow-sm">
            <Sparkles className="w-6 h-6 text-white" />
          </div>

          {error ? (
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2 text-left">
                <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                <span>{error}</span>
              </div>
              <Button variant="primary" onClick={() => navigate('/login')}>
                Back to Sign In
              </Button>
            </div>
          ) : (
            <div className="space-y-3 py-4">
              <Loader2 className="w-8 h-8 text-[#168AAD] animate-spin mx-auto" />
              <h2 className="text-base font-bold text-[#172B3A]">Authenticating with Google...</h2>
              <p className="text-xs text-[#5A6E7F]">Please wait while we complete your sign-in.</p>
            </div>
          )}
        </GlassCard>
      </div>
    </div>
  )
}
