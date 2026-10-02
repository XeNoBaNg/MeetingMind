import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Shell } from './components/layout/Shell'
import { Dashboard } from './pages/dashboard/Dashboard'
import { ActionItems } from './pages/actionitems/ActionItems'
import { NewMeeting } from './pages/meetings/NewMeeting'
import { MeetingDetails } from './pages/meetings/MeetingDetails'
import { SearchPage } from './pages/search/SearchPage'
import { CalendarPage } from './pages/calendar/CalendarPage'

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
        element: <Dashboard />,
      },
      {
        path: '/search',
        element: <SearchPage />,
      },
      {
        path: '/action-items',
        element: <ActionItems />,
      },
      {
        path: '/meetings/new',
        element: <NewMeeting />,
      },
      {
        path: '/meetings/:id',
        element: <MeetingDetails />,
      },
      {
        path: '/calendar',
        element: <CalendarPage />,
      }
    ]
  }
])

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  )
}
