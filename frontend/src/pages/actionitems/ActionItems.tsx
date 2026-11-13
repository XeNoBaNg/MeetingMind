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
  AlertCircle,
  CheckCheck
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
      <GlassCard className="border-rose-300 bg-rose-50/60 text-rose-800">
        <div className="flex items-center gap-2 mb-1">
          <AlertCircle className="w-5 h-5 text-rose-600" />
          <h2 className="text-base font-bold">Failed to load action items</h2>
        </div>
        <p className="text-xs text-rose-700">{error.message}</p>
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
    <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#172B3A] tracking-tight">
          Action Items & Deliverables
        </h1>
        <p className="text-xs sm:text-sm text-[#5A6E7F] mt-1">
          Review, assign, and track deliverables extracted across all meeting transcripts.
        </p>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Total Deliverables"
          value={totalTasks}
          icon={ListTodo}
          change={`${assignees.length} assignees`}
          trend="neutral"
          subtitle="All extracted tasks"
        />
        <StatCard
          title="Pending Deliverables"
          value={openTasks}
          icon={Clock}
          change={openTasks > 0 ? `${openTasks} open tasks` : 'All tasks completed'}
          trend={openTasks > 0 ? 'neutral' : 'up'}
          subtitle="Needs action"
        />
        <StatCard
          title="Completed Deliverables"
          value={doneTasks}
          icon={CheckCheck}
          change={`${totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0}% completion`}
          trend="up"
          subtitle="Resolved tasks"
        />
      </div>

      {/* Filter and Search Bar */}
      <GlassCard padding="sm" className="space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#718096]">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search deliverables by description..."
              className="w-full h-9 pl-9 pr-4 rounded-xl bg-white border border-[#648296]/20 text-xs sm:text-sm text-[#172B3A] placeholder-[#718096] focus:outline-none focus:border-[#168AAD] focus:ring-2 focus:ring-[#168AAD]/15 shadow-[inset_0_1px_1.5px_rgba(23,43,58,0.025)] transition-all"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Status Filter */}
            <div className="flex items-center gap-1 bg-[#EAF1F6]/70 p-1 rounded-xl border border-[#648296]/14 text-xs font-medium shadow-[inset_0_1px_2px_rgba(23,43,58,0.04)]">
              {(['ALL', 'OPEN', 'DONE'] as const).map((status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`
                    px-2.5 py-1 rounded-lg transition-colors cursor-pointer text-xs
                    ${
                      statusFilter === status
                        ? 'bg-white text-[#172B3A] font-semibold shadow-[0_1px_2px_rgba(23,43,58,0.06),inset_0_1px_0_0_#ffffff]'
                        : 'text-[#5A6E7F] hover:text-[#172B3A]'
                    }
                  `}
                >
                  {status === 'ALL' ? 'All' : status === 'OPEN' ? 'Pending' : 'Done'}
                </button>
              ))}
            </div>

            {/* Assignee Filter Dropdown */}
            {assignees.length > 0 && (
              <select
                value={assigneeFilter}
                onChange={(e) => setAssigneeFilter(e.target.value)}
                className="h-9 px-3 rounded-xl bg-white border border-[#648296]/20 text-xs text-[#172B3A] focus:outline-none focus:border-[#168AAD] shadow-[inset_0_1px_1.5px_rgba(23,43,58,0.025)] cursor-pointer"
              >
                <option value="ALL">All Assignees</option>
                {assignees.map(name => (
                  <option key={name} value={name}>{name}</option>
                ))}
              </select>
            )}
          </div>
        </div>
      </GlassCard>

      {/* Action Items List */}
      {filteredItems.length === 0 ? (
        <EmptyState
          icon={ListTodo}
          title={searchQuery || statusFilter !== 'ALL' ? 'No matching deliverables' : 'No action items yet'}
          description={
            searchQuery || statusFilter !== 'ALL'
              ? 'No tasks match your active filters. Try resetting the search or filter options.'
              : 'Action items will be extracted automatically when you analyze meeting transcripts.'
          }
          actionLabel={searchQuery || statusFilter !== 'ALL' ? 'Reset Filters' : 'New Meeting'}
          onAction={() => {
            setSearchQuery('')
            setStatusFilter('ALL')
            setAssigneeFilter('ALL')
          }}
        />
      ) : (
        <div className="space-y-3">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              className={`
                group relative overflow-hidden p-4 sm:p-5 rounded-2xl bg-gradient-to-b from-white/95 to-white/85 border border-[#648296]/16 shadow-[0_1px_3px_rgba(23,43,58,0.03),0_6px_16px_-4px_rgba(23,43,58,0.04),inset_0_1px_0_0_rgba(255,255,255,0.95)] hover:shadow-[0_8px_20px_-3px_rgba(23,43,58,0.07),inset_0_1px_0_0_rgba(255,255,255,1)] hover:border-[#168AAD]/30 hover:-translate-y-0.5 transition-all duration-200
                flex flex-col sm:flex-row sm:items-center justify-between gap-4
                ${item.status === 'DONE' ? 'opacity-80' : ''}
              `}
            >
              {/* Top subtle light reflection */}
              <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/90 to-transparent pointer-events-none" />
              <div className="flex items-start gap-3.5 flex-1 min-w-0">
                <button
                  onClick={() => toggleStatus(item.id, item.status)}
                  className="mt-0.5 text-[#718096] hover:text-emerald-600 transition-colors cursor-pointer flex-shrink-0"
                  title={item.status === 'DONE' ? 'Mark as Pending' : 'Mark as Done'}
                  aria-label={item.status === 'DONE' ? 'Mark as Pending' : 'Mark as Done'}
                >
                  {item.status === 'DONE' ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  ) : (
                    <Circle className="w-5 h-5 text-[#718096] group-hover:text-emerald-600" />
                  )}
                </button>

                <div className="space-y-1.5 flex-1 min-w-0">
                  <p className={`text-sm sm:text-base font-semibold leading-snug ${
                    item.status === 'DONE' ? 'line-through text-[#718096]' : 'text-[#172B3A]'
                  }`}>
                    {item.description}
                  </p>

                  <div className="flex flex-wrap items-center gap-3 text-xs text-[#5A6E7F]">
                    {item.assignee && (
                      <span className="flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-[#718096]" />
                        <span>{item.assignee}</span>
                      </span>
                    )}

                    {item.dueDate && (
                      <span className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-[#718096]" />
                        <span>Due: <strong className="text-[#172B3A]">{item.dueDate}</strong></span>
                      </span>
                    )}

                    {item.meetingId && (
                      <Link
                        to={`/meetings/${item.meetingId}`}
                        className="text-[#168AAD] hover:underline"
                      >
                        View meeting
                      </Link>
                    )}
                  </div>

                  {item.context && (
                    <p className="text-xs text-[#718096] italic bg-[#F4F7FA] p-2.5 rounded-lg border border-[#648296]/10 mt-1 max-w-2xl">
                      "{item.context}"
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-3 flex-shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-[#648296]/10">
                <button
                  onClick={() => toggleStatus(item.id, item.status)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors cursor-pointer ${
                    item.status === 'DONE'
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                      : 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
                  }`}
                >
                  {item.status === 'DONE' ? 'Completed' : 'Mark Done'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
