import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useActionItems, useUpdateActionItemStatus } from '../../hooks/useActionItems'
import {
  ListTodo,
  CheckCircle2,
  Circle,
  Clock,
  Search,
  User,
  Video,
  CheckCheck,
  AlertCircle
} from 'lucide-react'
import { GlassCard } from '../../components/common/GlassCard'
import { StatCard } from '../../components/common/StatCard'
import { EmptyState } from '../../components/common/EmptyState'
import { PageSkeleton } from '../../components/common/LoadingSkeleton'

export function ActionItems() {
  const { data, isLoading, error } = useActionItems()
  const { mutate: updateStatus } = useUpdateActionItemStatus()

  const [statusFilter, setStatusFilter] = useState<'ALL' | 'OPEN' | 'DONE'>('ALL')
  const [assigneeFilter, setAssigneeFilter] = useState<string>('ALL')
  const [searchQuery, setSearchQuery] = useState('')

  if (isLoading) {
    return <PageSkeleton />
  }

  if (error) {
    return (
      <GlassCard className="border-rose-500/30 bg-rose-500/5">
        <div className="flex items-center gap-3 text-rose-400 mb-2">
          <AlertCircle className="w-5 h-5" />
          <h2 className="text-lg font-bold">Failed to load action items</h2>
        </div>
        <p className="text-sm text-slate-400">{error.message}</p>
      </GlassCard>
    )
  }

  const items = data?.data || []

  // Extract unique assignees
  const assignees = Array.from(new Set(items.map(item => item.assignee).filter(Boolean))) as string[]

  const totalTasks = items.length
  const openTasks = items.filter(i => i.status === 'OPEN').length
  const doneTasks = items.filter(i => i.status === 'DONE').length

  // Filter items
  const filteredItems = items.filter(item => {
    if (statusFilter !== 'ALL' && item.status !== statusFilter) return false
    if (assigneeFilter !== 'ALL' && item.assignee !== assigneeFilter) return false
    if (searchQuery.trim() && !item.description.toLowerCase().includes(searchQuery.toLowerCase().trim())) {
      return false
    }
    return true
  })

  const toggleStatus = (id: string, currentStatus: 'OPEN' | 'DONE') => {
    const newStatus = currentStatus === 'OPEN' ? 'DONE' : 'OPEN'
    updateStatus({ id, status: newStatus })
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 shadow-md">
            <ListTodo className="w-5 h-5" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Action Items & Deliverables
          </h1>
        </div>
        <p className="text-sm text-slate-400 mt-1">
          Review, assign, and track deliverables extracted across all meeting transcripts.
        </p>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <StatCard
          title="Total Deliverables"
          value={totalTasks}
          icon={ListTodo}
          color="cyan"
          change={`${assignees.length} assignees`}
          trend="neutral"
          subtitle="All extracted tasks"
        />
        <StatCard
          title="Pending Deliverables"
          value={openTasks}
          icon={Clock}
          color="amber"
          change={openTasks > 0 ? `${openTasks} require completion` : 'All complete'}
          trend={openTasks > 0 ? 'neutral' : 'up'}
          subtitle="Active items"
        />
        <StatCard
          title="Completed Deliverables"
          value={doneTasks}
          icon={CheckCheck}
          color="emerald"
          change={`${totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0}% completion`}
          trend="up"
          subtitle="Resolved tasks"
        />
      </div>

      {/* Filter and Control Bar */}
      <GlassCard padding="sm" className="space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Search task description */}
          <div className="relative flex-1 max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search deliverables by keyword..."
              className="w-full h-10 pl-10 pr-4 rounded-xl bg-[#081220]/70 border border-white/10 text-sm text-white placeholder-slate-400 focus:outline-none focus:border-cyan-500/60 focus:ring-2 focus:ring-cyan-500/20 transition-all"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Status Segmented Buttons */}
            <div className="flex items-center rounded-xl bg-[#081220]/80 p-1 border border-white/10">
              {(['ALL', 'OPEN', 'DONE'] as const).map((status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    statusFilter === status
                      ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {status === 'ALL' ? 'All' : status === 'OPEN' ? 'Open' : 'Done'}
                </button>
              ))}
            </div>

            {/* Assignee Filter Dropdown */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <User className="w-3.5 h-3.5" />
              </div>
              <select
                value={assigneeFilter}
                onChange={(e) => setAssigneeFilter(e.target.value)}
                className="h-10 pl-9 pr-8 rounded-xl bg-[#081220]/80 border border-white/10 text-xs text-white focus:outline-none focus:border-cyan-500/60 focus:ring-2 focus:ring-cyan-500/20 appearance-none cursor-pointer"
              >
                <option value="ALL">All Assignees</option>
                {assignees.map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </GlassCard>

      {/* Action Items List */}
      <div className="space-y-3">
        {filteredItems.length === 0 ? (
          <EmptyState
            icon={ListTodo}
            title={searchQuery || statusFilter !== 'ALL' || assigneeFilter !== 'ALL' ? 'No deliverables match filters' : 'No action items yet'}
            description={
              searchQuery || statusFilter !== 'ALL' || assigneeFilter !== 'ALL'
                ? 'Try clearing your filters or search keywords to view other action items.'
                : 'Analyze a new meeting to have Extractor Agent identify tasks, assignees, and deadlines.'
            }
            actionLabel="Analyze New Meeting"
            onAction={() => window.location.href = '/meetings/new'}
          />
        ) : (
          filteredItems.map((item) => (
            <GlassCard
              key={item.id}
              padding="sm"
              className={`flex items-start gap-4 transition-all group ${
                item.status === 'DONE' ? 'opacity-70 border-white/[0.04]' : 'hover:border-cyan-500/30'
              }`}
            >
              {/* Checkbox */}
              <button
                onClick={() => toggleStatus(item.id, item.status)}
                className="mt-1 flex-shrink-0 text-slate-400 hover:text-cyan-400 transition-colors cursor-pointer"
                aria-label={item.status === 'OPEN' ? 'Mark as done' : 'Reopen'}
              >
                {item.status === 'DONE' ? (
                  <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                ) : (
                  <Circle className="w-6 h-6 hover:text-cyan-400" />
                )}
              </button>

              {/* Task Details */}
              <div className="flex-1 min-w-0 space-y-1.5">
                <p
                  className={`text-sm sm:text-base font-semibold leading-relaxed ${
                    item.status === 'DONE' ? 'line-through text-slate-400' : 'text-white'
                  }`}
                >
                  {item.description}
                </p>

                {item.context && (
                  <p className="text-xs text-slate-400 leading-normal">
                    {item.context}
                  </p>
                )}

                {/* Metadata Pills */}
                <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
                  {item.assignee && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 font-semibold">
                      <User className="w-3 h-3" />
                      {item.assignee}
                    </span>
                  )}

                  {item.dueDate && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-white/[0.05] border border-white/10 text-slate-300 font-mono">
                      <Clock className="w-3 h-3 text-cyan-400" />
                      Due: {item.dueDate}
                    </span>
                  )}

                  <span className="text-white/20">•</span>

                  <Link
                    to={`/meetings/${item.meetingId}`}
                    className="inline-flex items-center gap-1.5 text-slate-400 hover:text-cyan-300 transition-colors font-medium truncate max-w-[240px]"
                  >
                    <Video className="w-3 h-3 text-cyan-400" />
                    <span className="truncate">{item.meetingTitle || 'Meeting Details'}</span>
                  </Link>
                </div>
              </div>
            </GlassCard>
          ))
        )}
      </div>
    </div>
  )
}
