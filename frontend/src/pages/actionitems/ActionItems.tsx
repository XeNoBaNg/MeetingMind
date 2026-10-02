import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useActionItems, useUpdateActionItemStatus } from '../../hooks/useActionItems'
import { ListTodo, CheckCircle2, Circle, Clock, Filter } from 'lucide-react'

export function ActionItems() {
  const { data, isLoading, error } = useActionItems()
  const { mutate: updateStatus } = useUpdateActionItemStatus()
  
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'OPEN' | 'DONE'>('ALL')
  const [assigneeFilter, setAssigneeFilter] = useState<string>('ALL')

  if (isLoading) {
    return (
      <div className="p-8 max-w-6xl mx-auto space-y-6">
        <div className="h-8 w-48 bg-slate-200 dark:bg-slate-800 rounded animate-pulse mb-8" />
        <div className="h-12 w-full bg-slate-200 dark:bg-slate-800 rounded animate-pulse mb-6" />
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="h-24 bg-slate-200 dark:bg-slate-800 rounded-xl animate-pulse" />
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-8 text-red-600 dark:text-red-400">
        <h2 className="text-xl font-bold mb-2">Failed to load action items</h2>
        <p>{error.message}</p>
      </div>
    )
  }

  const items = data?.data || []
  
  // Get unique assignees
  const assignees = Array.from(new Set(items.map(item => item.assignee).filter(Boolean)))

  // Filter items
  const filteredItems = items.filter(item => {
    if (statusFilter !== 'ALL' && item.status !== statusFilter) return false
    if (assigneeFilter !== 'ALL' && item.assignee !== assigneeFilter) return false
    return true
  })

  const toggleStatus = (id: string, currentStatus: 'OPEN' | 'DONE') => {
    const newStatus = currentStatus === 'OPEN' ? 'DONE' : 'OPEN'
    updateStatus({ id, status: newStatus })
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
            <ListTodo className="w-6 h-6 text-blue-500" />
            Action Items
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Track and manage deliverables across all meetings.</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Filter className="w-4 h-4 text-slate-400" />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="pl-9 pr-8 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md text-sm text-slate-700 dark:text-slate-300 shadow-sm focus:ring-2 focus:ring-blue-500 appearance-none"
            >
              <option value="ALL">All Statuses</option>
              <option value="OPEN">Open</option>
              <option value="DONE">Done</option>
            </select>
          </div>
          
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Filter className="w-4 h-4 text-slate-400" />
            </div>
            <select
              value={assigneeFilter}
              onChange={(e) => setAssigneeFilter(e.target.value)}
              className="pl-9 pr-8 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md text-sm text-slate-700 dark:text-slate-300 shadow-sm focus:ring-2 focus:ring-blue-500 appearance-none"
            >
              <option value="ALL">All Assignees</option>
              {assignees.map(a => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {filteredItems.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-12 text-center shadow-sm">
            <ListTodo className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">No action items found</h3>
            <p className="text-slate-500 dark:text-slate-400">Try adjusting your filters or analyze a new meeting.</p>
          </div>
        ) : (
          filteredItems.map(item => (
            <div 
              key={item.id} 
              className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm transition-all flex items-start gap-4 ${
                item.status === 'DONE' ? 'opacity-75' : ''
              }`}
            >
              <button
                onClick={() => toggleStatus(item.id, item.status)}
                className="mt-1 flex-shrink-0 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors focus:outline-none"
                aria-label={item.status === 'OPEN' ? 'Mark as done' : 'Reopen'}
              >
                {item.status === 'DONE' ? (
                  <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                ) : (
                  <Circle className="w-6 h-6" />
                )}
              </button>
              
              <div className="flex-1 min-w-0">
                <p className={`text-base font-medium text-slate-900 dark:text-white mb-1 ${
                  item.status === 'DONE' ? 'line-through text-slate-500 dark:text-slate-500' : ''
                }`}>
                  {item.description}
                </p>
                {item.context && (
                  <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">{item.context}</p>
                )}
                
                <div className="flex flex-wrap items-center gap-3 text-xs">
                  <span className="inline-flex items-center px-2 py-1 rounded bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 font-medium">
                    {item.assignee}
                  </span>
                  
                  {item.dueDate && (
                    <span className="flex items-center gap-1 text-slate-500 dark:text-slate-400 font-medium">
                      <Clock className="w-3.5 h-3.5" />
                      {item.dueDate}
                    </span>
                  )}
                  
                  <span className="text-slate-300 dark:text-slate-700">•</span>
                  
                  <Link 
                    to={`/meetings/${item.meetingId}`}
                    className="text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 font-medium transition-colors truncate max-w-[200px]"
                  >
                    {item.meetingTitle || 'Meeting'}
                  </Link>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
