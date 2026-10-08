import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { apiClient } from '../../api/client'
import { useAuth } from '../../features/auth/AuthContext'
import { Loader2, ShieldCheck, Server, AlertTriangle } from 'lucide-react'

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
      <div className="flex h-screen items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
        <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-red-200 dark:border-red-900 p-8 text-center">
          <AlertTriangle className="mx-auto h-12 w-12 text-red-500 mb-4" />
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Invalid Request</h2>
          <p className="text-gray-600 dark:text-gray-400">
            Missing required authorization parameters (client_id, redirect_uri).
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8 bg-white dark:bg-gray-800 p-10 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700">
        <div className="text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900">
            <Server className="h-8 w-8 text-blue-600 dark:text-blue-400" />
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900 dark:text-white">
            Connect an App
          </h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            The application <span className="font-semibold text-gray-900 dark:text-gray-200">{clientId}</span> is requesting access to your MeetingMind account.
          </p>
        </div>

        <div className="bg-gray-50 dark:bg-gray-750 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <h3 className="text-sm font-medium text-gray-900 dark:text-white flex items-center mb-3">
            <ShieldCheck className="h-4 w-4 mr-2 text-green-500" />
            This app would like to:
          </h3>
          <ul className="list-disc pl-5 text-sm text-gray-600 dark:text-gray-400 space-y-2">
            <li>Access and summarize your meetings</li>
            <li>Read and update your action items</li>
            <li>Analyze your meeting workload</li>
            <li>Draft follow-up emails on your behalf</li>
          </ul>
        </div>

        <div className="text-sm text-gray-500 dark:text-gray-400 text-center">
          Signed in as <span className="font-medium text-gray-900 dark:text-gray-200">{user?.email || user?.username}</span>
        </div>

        {error && (
          <div className="rounded-md bg-red-50 dark:bg-red-900/30 p-4 border border-red-200 dark:border-red-800">
            <p className="text-sm font-medium text-red-800 dark:text-red-300">{error}</p>
          </div>
        )}

        <div className="flex gap-4 mt-8">
          <button
            onClick={handleDeny}
            disabled={isAuthorizing}
            className="w-full flex justify-center py-2.5 px-4 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleAuthorize}
            disabled={isAuthorizing}
            className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {isAuthorizing ? (
              <>
                <Loader2 className="animate-spin -ml-1 mr-2 h-5 w-5" />
                Connecting...
              </>
            ) : (
              'Allow Access'
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
