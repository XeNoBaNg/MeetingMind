import { Link } from 'react-router-dom'
import { useMeetings } from '../../hooks/useMeetings'
import { useActionItems } from '../../hooks/useActionItems'
import { Calendar, ChevronRight, Clock, Activity, ListTodo } from 'lucide-react'

export function Dashboard() {
  const { data: meetingsData, isLoading: meetingsLoading, error: meetingsError } = useMeetings()
  const { data: actionItemsData, isLoading: actionItemsLoading } = useActionItems()

  if (meetingsLoading || actionItemsLoading) {
    return (
      <div className="p-8">
        <div className="h-8 w-48 bg-slate-200 dark:bg-slate-800 rounded animate-pulse mb-8" />
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-24 bg-slate-200 dark:bg-slate-800 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  if (meetingsError) {
    return (
      <div className="p-8 text-red-600 dark:text-red-400">
        <h2 className="text-xl font-bold mb-2">Failed to load dashboard data</h2>
        <p>{meetingsError.message}</p>
      </div>
    )
  }

  const meetings = meetingsData?.data || []
  const actionItems = actionItemsData?.data || []
  const openActionItems = actionItems.filter(ai => ai.status === 'OPEN').length

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Dashboard</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Overview of your recent meeting analyses.</p>
        </div>
        <Link 
          to="/meetings/new" 
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium transition-colors shadow-sm"
        >
          New Analysis
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400 mb-2">
            <Calendar className="w-5 h-5 text-blue-500" />
            <span className="font-medium">Total Meetings</span>
          </div>
          <span className="text-4xl font-bold text-slate-900 dark:text-white">{meetings.length}</span>
        </div>
        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400 mb-2">
            <Activity className="w-5 h-5 text-amber-500" />
            <span className="font-medium">Analyzing</span>
          </div>
          <span className="text-4xl font-bold text-slate-900 dark:text-white">
            {meetings.filter(m => m.status !== 'COMPLETED' && m.status !== 'FAILED').length}
          </span>
        </div>
        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400 mb-2">
            <Clock className="w-5 h-5 text-emerald-500" />
            <span className="font-medium">Completed</span>
          </div>
          <span className="text-4xl font-bold text-slate-900 dark:text-white">
            {meetings.filter(m => m.status === 'COMPLETED').length}
          </span>
        </div>
        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400 mb-2">
            <ListTodo className="w-5 h-5 text-indigo-500" />
            <span className="font-medium">Open Tasks</span>
          </div>
          <span className="text-4xl font-bold text-slate-900 dark:text-white">
            {openActionItems}
          </span>
        </div>
      </div>

      <div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Recent Meetings</h2>
        {meetings.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-12 text-center shadow-sm">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 mb-4">
              <Calendar className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">No meetings yet</h3>
            <p className="text-slate-500 dark:text-slate-400 mb-6 max-w-sm mx-auto">
              You haven't analyzed any meetings. Paste a transcript to get AI-generated summaries and action items.
            </p>
            <Link 
              to="/meetings/new" 
              className="inline-flex px-4 py-2 bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-white text-white dark:text-slate-900 rounded-md font-medium transition-colors"
            >
              Analyze your first meeting
            </Link>
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden flex flex-col divide-y divide-slate-100 dark:divide-slate-800">
            {meetings.map((meeting) => (
              <Link 
                key={meeting.id} 
                to={`/meetings/${meeting.id}`}
                className="p-4 sm:p-6 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors flex items-center justify-between group"
              >
                <div>
                  <h3 className="font-semibold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {meeting.title || 'Untitled Meeting'}
                  </h3>
                  <div className="flex items-center gap-4 mt-2 text-sm text-slate-500 dark:text-slate-400">
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-4 h-4" />
                      {new Date(meeting.createdAt).toLocaleDateString()}
                    </span>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                      meeting.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800' :
                      meeting.status === 'FAILED' ? 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/30 dark:text-red-400 dark:border-red-800' :
                      'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-800'
                    }`}>
                      {meeting.status}
                    </span>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-blue-500 transition-colors" />
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
