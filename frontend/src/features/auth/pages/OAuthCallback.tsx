import React, { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../AuthContext'
import { apiClient } from '../../../api/client'

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
        setError('Failed to authenticate with Google. The link may have expired.')
      }
    }

    exchangeCode()
  }, [location, login, navigate])

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 dark:bg-slate-900">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-center">
            <h2 className="text-xl font-medium text-red-600 dark:text-red-400 mb-4">Authentication Error</h2>
            <p className="text-slate-600 dark:text-slate-300 mb-6">{error}</p>
            <button
              onClick={() => navigate('/login')}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
            >
              Return to Login
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 dark:bg-slate-900">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <h2 className="mt-6 text-xl font-medium text-slate-900 dark:text-white">
          Authenticating...
        </h2>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          Please wait while we complete your sign in.
        </p>
      </div>
    </div>
  )
}
