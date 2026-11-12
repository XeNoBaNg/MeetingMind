import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { apiClient } from '../../api/client'
import { useAuth } from '../../features/auth/AuthContext'
import { ShieldCheck, AlertTriangle, ArrowRight, BrainCircuit } from 'lucide-react'
import { GlassCard } from '../../components/common/GlassCard'
import { Button } from '../../components/common/Button'

export function McpConnectPage() {
  const [searchParams] = useSearchParams()
  const { user } = useAuth()
  const [isAuthorizing, setIsAuthorizing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const clientId = searchParams.get('client_id')
  const redirectUri = searchParams.get('redirect_uri')
  const codeChallenge = searchParams.get('code_challenge')
  const state = searchParams.get('state')
  const scope = searchParams.get('scope')

  const handleAuthorize = async () => {
    if (!clientId || !redirectUri || !codeChallenge || !state) {
      setError('Missing required authorization parameters.')
      return
    }

    try {
      setIsAuthorizing(true)
      setError(null)
      const response = await apiClient.post('/mcp/authorize', {
        clientId,
        redirectUri,
        codeChallenge,
        scope: scope || 'all',
        state
      })
      const data = response as any

      // Redirect back to the local client callback
      window.location.href = data.redirectUrl
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Authorization failed')
      setIsAuthorizing(false)
    }
  }

  const handleDeny = () => {
    if (redirectUri) {
      const url = new URL(redirectUri)
      url.searchParams.set('error', 'access_denied')
      if (state) url.searchParams.set('state', state)
      window.location.href = url.toString()
    } else {
      setError('Cannot redirect: Missing redirect URI.')
    }
  }

  if (!clientId || !redirectUri) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#060d17] p-4">
        <GlassCard className="max-w-md w-full border-rose-500/30 text-center p-8 space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 mx-auto">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-white">Invalid Authorization Request</h2>
          <p className="text-xs text-slate-400">
            Missing required OAuth 2.0 PKCE parameters (client_id, redirect_uri, or code_challenge).
          </p>
        </GlassCard>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#060d17] p-4 relative">
      <div className="ambient-glow" />

      <div className="relative z-10 w-full max-w-md">
        <GlassCard padding="lg" className="space-y-6 border-cyan-500/30 shadow-2xl shadow-cyan-950/40">
          {/* Logo & Header */}
          <div className="text-center space-y-2">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 p-0.5 mx-auto shadow-lg shadow-cyan-500/30">
              <div className="w-full h-full bg-[#07111e] rounded-[14px] flex items-center justify-center">
                <BrainCircuit className="w-7 h-7 text-cyan-400" />
              </div>
            </div>
            <h2 className="text-2xl font-extrabold text-white tracking-tight">
              Connect to MeetingMind
            </h2>
            <p className="text-xs text-slate-400">
              The application <span className="font-semibold text-cyan-300 font-mono">{clientId}</span> is requesting access to your meeting intelligence data.
            </p>
          </div>

          {/* Scopes Box */}
          <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.08] space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Requested Permissions</span>
            </h3>
            <ul className="text-xs text-slate-300 space-y-2">
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                <span>Read & summarize your meeting transcripts</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                <span>Extract, view, and mark action items as done</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                <span>Analyze team workload distribution</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                <span>Retrieve follow-up drafts and decision records</span>
              </li>
            </ul>
          </div>

          <div className="text-center text-xs text-slate-400">
            Authorizing as <span className="font-bold text-white">{user?.email || user?.username}</span>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
              {error}
            </div>
          )}

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <Button
              variant="secondary"
              onClick={handleDeny}
              disabled={isAuthorizing}
            >
              Deny
            </Button>
            <Button
              variant="primary"
              onClick={handleAuthorize}
              loading={isAuthorizing}
              icon={ArrowRight}
              iconPosition="right"
            >
              Allow Access
            </Button>
          </div>
        </GlassCard>
      </div>
    </div>
  )
}
