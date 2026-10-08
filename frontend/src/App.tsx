import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Shell } from './components/layout/Shell'
import { Dashboard } from './pages/dashboard/Dashboard'
import { ActionItems } from './pages/actionitems/ActionItems'
import { NewMeeting } from './pages/meetings/NewMeeting'
import { MeetingDetails } from './pages/meetings/MeetingDetails'
import { SearchPage } from './pages/search/SearchPage'
import { CalendarPage } from './pages/calendar/CalendarPage'
import { AuthProvider } from './features/auth/AuthContext'
import { ProtectedRoute } from './features/auth/components/ProtectedRoute'
import { LoginPage } from './features/auth/pages/LoginPage'
import { RegisterPage } from './features/auth/pages/RegisterPage'
import { OAuthCallback } from './features/auth/pages/OAuthCallback'
import { McpConnectPage } from './pages/mcp/McpConnectPage'

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
        path: '/search',
        element: <ProtectedRoute><SearchPage /></ProtectedRoute>,
      },
      {
        path: '/action-items',
        element: <ProtectedRoute><ActionItems /></ProtectedRoute>,
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
        path: '/calendar',
        element: <ProtectedRoute><CalendarPage /></ProtectedRoute>,
      },
      {
        path: '/mcp-connect',
        element: <ProtectedRoute><McpConnectPage /></ProtectedRoute>,
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
