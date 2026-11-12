import React, { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../AuthContext'
import { apiClient } from '../../../api/client'
import { BrainCircuit, Loader2, AlertCircle } from 'lucide-react'
import { GlassCard } from '../../../components/common/GlassCard'
import { Button } from '../../../components/common/Button'

export function OAuthCallback() {
  const [error, setError] = useState('')
  const navigate = useNavigate()
  const location = useLocation()
  const { login } = useAuth()

  const hasExchanged = React.useRef(false)

  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const code = params.get('code')

    if (!code) {
      setError('No authorization code found.')
      return
    }

    if (hasExchanged.current) {
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
  }, [location, login, navigate])

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#060d17] p-4 relative">
        <div className="ambient-glow" />
        <GlassCard padding="lg" className="max-w-md w-full border-rose-500/30 text-center space-y-4 relative z-10">
          <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 mx-auto">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-white">Authentication Error</h2>
          <p className="text-xs text-slate-300">{error}</p>
          <Button variant="secondary" className="w-full" onClick={() => navigate('/login')}>
            Return to Login
          </Button>
        </GlassCard>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#060d17] p-4 relative">
      <div className="ambient-glow" />
      <div className="text-center space-y-4 relative z-10">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 p-0.5 mx-auto shadow-lg shadow-cyan-500/30">
          <div className="w-full h-full bg-[#07111e] rounded-[14px] flex items-center justify-center">
            <BrainCircuit className="w-7 h-7 text-cyan-400" />
          </div>
        </div>
        <div className="flex items-center justify-center gap-2 text-white font-semibold">
          <Loader2 className="w-5 h-5 text-cyan-400 animate-spin" />
          <span>Completing Authentication...</span>
        </div>
        <p className="text-xs text-slate-400">
          Verifying Google OAuth token with backend security filter chain...
        </p>
      </div>
    </div>
  )
}
