import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { apiClient } from '../../api/client'
import { useAuth } from '../../features/auth/AuthContext'
import { ShieldCheck, AlertTriangle, ArrowRight, Sparkles } from 'lucide-react'
import { GlassCard } from '../../components/common/GlassCard'
import { Button } from '../../components/common/Button'
import { formatDisplayName } from '../../utils/userGreeting'

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

  const displayName = formatDisplayName(user)

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
      <div className="min-h-screen flex items-center justify-center bg-[#F4F7FA] p-4 text-[#172B3A]">
        <GlassCard className="max-w-md w-full border-rose-300 text-center p-8 space-y-4">
          <div className="w-12 h-12 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 mx-auto">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-[#172B3A]">Invalid Connection Request</h2>
          <p className="text-xs text-[#5A6E7F]">
            Missing required authorization parameters (client_id, redirect_uri, or code_challenge).
          </p>
        </GlassCard>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F4F7FA] p-4 relative text-[#172B3A]">
      <div className="relative z-10 w-full max-w-md">
        <GlassCard padding="lg" className="space-y-6 shadow-md border-[#648296]/20">
          {/* Logo & Header */}
          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded-xl bg-[#168AAD] text-white flex items-center justify-center mx-auto shadow-sm">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-xl font-extrabold text-[#172B3A] tracking-tight">
              Connect to MeetingMind
            </h2>
            <p className="text-xs text-[#5A6E7F]">
              The application <span className="font-semibold text-[#168AAD] font-mono">{clientId}</span> is requesting access to your meeting intelligence data.
            </p>
          </div>

          {/* Permissions Box */}
          <div className="p-4 rounded-xl bg-[#F4F7FA] border border-[#648296]/16 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#5A6E7F] flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Requested Permissions</span>
            </h3>

            <ul className="text-xs text-[#172B3A] space-y-2">
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#168AAD] mt-1.5 flex-shrink-0" />
                <span>Read meeting titles, summaries, and key decisions</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#168AAD] mt-1.5 flex-shrink-0" />
                <span>Read and update action-item completion statuses</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#168AAD] mt-1.5 flex-shrink-0" />
                <span>Calculate team workloads and view deadlines</span>
              </li>
            </ul>
          </div>

          {/* User confirmation */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-[#EAF1F6]/70 border border-[#648296]/14 text-xs">
            <span className="text-[#5A6E7F]">Authorizing as:</span>
            <span className="font-semibold text-[#172B3A]">{displayName}</span>
          </div>

          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-3 pt-2">
            <Button
              variant="secondary"
              className="flex-1"
              onClick={handleDeny}
              disabled={isAuthorizing}
            >
              Deny
            </Button>
            <Button
              variant="primary"
              className="flex-1"
              icon={ArrowRight}
              iconPosition="right"
              onClick={handleAuthorize}
              loading={isAuthorizing}
            >
              Authorize
            </Button>
          </div>
        </GlassCard>
      </div>
    </div>
  )
}
