import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Shell } from './components/layout/Shell'
import { Dashboard } from './pages/dashboard/Dashboard'
import { MeetingsPage } from './pages/meetings/MeetingsPage'
import { NewMeeting } from './pages/meetings/NewMeeting'
import { MeetingDetails } from './pages/meetings/MeetingDetails'
import { ActionItems } from './pages/actionitems/ActionItems'
import { EmailDraftsPage } from './pages/drafts/EmailDraftsPage'
import { SearchPage } from './pages/search/SearchPage'
import { CalendarPage } from './pages/calendar/CalendarPage'
import { McpPage } from './pages/mcp/McpPage'
import { McpConnectPage } from './pages/mcp/McpConnectPage'
import { SettingsPage } from './pages/settings/SettingsPage'
import { AuthProvider } from './features/auth/AuthContext'
import { ProtectedRoute } from './features/auth/components/ProtectedRoute'
import { LoginPage } from './features/auth/pages/LoginPage'
import { RegisterPage } from './features/auth/pages/RegisterPage'
import { OAuthCallback } from './features/auth/pages/OAuthCallback'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

const router = createBrowserRouter([
  {
    path: '/',
    element: <Shell />,
    children: [
      {
        path: '/',
        element: <ProtectedRoute><Dashboard /></ProtectedRoute>,
      },
      {
        path: '/meetings',
        element: <ProtectedRoute><MeetingsPage /></ProtectedRoute>,
      },
      {
        path: '/meetings/new',
        element: <ProtectedRoute><NewMeeting /></ProtectedRoute>,
      },
      {
        path: '/meetings/:id',
        element: <ProtectedRoute><MeetingDetails /></ProtectedRoute>,
      },
      {
        path: '/action-items',
        element: <ProtectedRoute><ActionItems /></ProtectedRoute>,
      },
      {
        path: '/drafts',
        element: <ProtectedRoute><EmailDraftsPage /></ProtectedRoute>,
      },
      {
        path: '/search',
        element: <ProtectedRoute><SearchPage /></ProtectedRoute>,
      },
      {
        path: '/calendar',
        element: <ProtectedRoute><CalendarPage /></ProtectedRoute>,
      },
      {
        path: '/mcp',
        element: <ProtectedRoute><McpPage /></ProtectedRoute>,
      },
      {
        path: '/mcp-connect',
        element: <ProtectedRoute><McpConnectPage /></ProtectedRoute>,
      },
      {
        path: '/settings',
        element: <ProtectedRoute><SettingsPage /></ProtectedRoute>,
      }
    ]
  },
  {
    path: '/login',
    element: <LoginPage />
  },
  {
    path: '/register',
    element: <RegisterPage />
  },
  {
    path: '/oauth-callback',
    element: <OAuthCallback />
  }
])

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <RouterProvider router={router} />
      </AuthProvider>
    </QueryClientProvider>
  )
}
