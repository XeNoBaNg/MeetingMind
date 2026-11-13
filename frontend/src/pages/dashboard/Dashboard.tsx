import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useMeetings } from '../../hooks/useMeetings'
import { useActionItems, useUpdateActionItemStatus } from '../../hooks/useActionItems'
import { useAuth } from '../../features/auth/AuthContext'
import {
  Video,
  ListTodo,
  CheckCircle2,
  Clock,
  ArrowRight,
  Circle,
  Plus,
  Search,
  CheckCheck
} from 'lucide-react'
import { StatCard } from '../../components/common/StatCard'
import { GlassCard } from '../../components/common/GlassCard'
import { StatusBadge } from '../../components/common/Badge'
import { Button } from '../../components/common/Button'
import { EmptyState } from '../../components/common/EmptyState'
import { PageSkeleton } from '../../components/common/LoadingSkeleton'
import { getGreeting, formatDisplayName } from '../../utils/userGreeting'

export function Dashboard() {
  const { user } = useAuth()
  const { data: meetingsData, isLoading: meetingsLoading, error: meetingsError } = useMeetings()
  const { data: actionItemsData, isLoading: actionItemsLoading } = useActionItems()
  const { mutate: updateStatus } = useUpdateActionItemStatus()

  const greeting = useMemo(() => getGreeting(), [])
  const displayName = useMemo(() => formatDisplayName(user), [user])

  if (meetingsLoading || actionItemsLoading) {
    return <PageSkeleton />
  }

  if (meetingsError) {
    return (
      <GlassCard className="border-rose-300 bg-rose-50/60 text-rose-800">
        <h2 className="text-base font-bold mb-1">Failed to load dashboard data</h2>
        <p className="text-xs text-rose-700">{meetingsError.message}</p>
      </GlassCard>
    )
  }

  const meetings = meetingsData?.data || []
  const actionItems = actionItemsData?.data || []

  const totalMeetings = meetings.length
  const completedMeetings = meetings.filter(m => m.status === 'COMPLETED').length
  const processingMeetings = meetings.filter(m => m.status !== 'COMPLETED' && m.status !== 'FAILED').length
  const openActionItems = actionItems.filter(ai => ai.status === 'OPEN').length
  const completedActionItems = actionItems.filter(ai => ai.status === 'DONE').length

  const completionRate = totalMeetings > 0 
    ? Math.round((completedMeetings / totalMeetings) * 100) 
    : 0

  const toggleTaskStatus = (id: string, currentStatus: 'OPEN' | 'DONE') => {
    const newStatus = currentStatus === 'OPEN' ? 'DONE' : 'OPEN'
    updateStatus({ id, status: newStatus })
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-200">
      {/* Welcome Section */}
      <div className="relative rounded-2xl bg-gradient-to-br from-white/96 via-white/90 to-[#EAF1F6]/50 backdrop-blur-md border border-[#648296]/16 p-6 sm:p-8 shadow-[0_1px_2px_rgba(23,43,58,0.025),0_8px_24px_-4px_rgba(23,43,58,0.045),inset_0_1px_0_0_rgba(255,255,255,0.95)]">
        {/* Top-edge reflection hairline */}
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/90 to-transparent rounded-t-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#172B3A] tracking-tight">
              {greeting}, {displayName}
            </h1>
            <p className="text-sm text-[#5A6E7F] max-w-2xl leading-relaxed">
              Here is what is happening with your meetings, deliverables, and follow-up communication.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link to="/meetings/new">
              <Button variant="primary" icon={Plus}>
                New Meeting
              </Button>
            </Link>
            <Link to="/search">
              <Button variant="secondary" icon={Search}>
                Search Meetings
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Meetings"
          value={totalMeetings}
          icon={Video}
          change={totalMeetings > 0 ? `${totalMeetings} recorded` : 'No meetings yet'}
          trend="neutral"
          subtitle="All sessions"
        />
        <StatCard
          title="Meetings Processed"
          value={completedMeetings}
          icon={CheckCircle2}
          change={`${completionRate}% completed`}
          trend={completionRate > 50 ? 'up' : 'neutral'}
          subtitle={processingMeetings > 0 ? `${processingMeetings} processing` : 'Up to date'}
        />
        <StatCard
          title="Pending Action Items"
          value={openActionItems}
          icon={ListTodo}
          change={openActionItems > 0 ? `${openActionItems} open tasks` : 'All caught up'}
          trend={openActionItems > 0 ? 'neutral' : 'up'}
          subtitle="Assigned deliverables"
        />
        <StatCard
          title="Completed Action Items"
          value={completedActionItems}
          icon={CheckCheck}
          change={`${completedActionItems} closed`}
          trend="up"
          subtitle="Resolved deliverables"
        />
      </div>

      {/* Activity & Meeting Overview (2 Columns) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (1 Col): Meeting Activity Summary */}
        <GlassCard className="lg:col-span-1 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#648296]/14">
              <div>
                <h3 className="font-bold text-[#172B3A] text-sm">Meeting Activity</h3>
                <p className="text-xs text-[#718096]">Processing and deliverable overview</p>
              </div>
            </div>

            {/* Progress Bars with Inset Depth */}
            <div className="space-y-4 pt-1">
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-medium">
                  <span className="text-[#5A6E7F]">Meetings Processed</span>
                  <span className="text-[#172B3A] font-semibold">{completedMeetings} / {totalMeetings}</span>
                </div>
                <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden p-0.5 border border-[#648296]/10 shadow-[inset_0_1px_2px_rgba(23,43,58,0.06)]">
                  <div
                    className="h-full bg-gradient-to-r from-[#168AAD] to-[#1da5cf] rounded-full shadow-[0_1px_2px_rgba(22,138,173,0.3)] transition-all duration-300"
                    style={{ width: `${totalMeetings ? (completedMeetings / totalMeetings) * 100 : 0}%` }}
                  />
                </div>
              </div>

              {processingMeetings > 0 && (
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-medium">
                    <span className="text-[#5A6E7F]">Meetings Being Processed</span>
                    <span className="text-amber-600 font-semibold">{processingMeetings}</span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden p-0.5 border border-[#648296]/10 shadow-[inset_0_1px_2px_rgba(23,43,58,0.06)]">
                    <div
                      className="h-full bg-gradient-to-r from-amber-500 to-amber-400 rounded-full shadow-[0_1px_2px_rgba(245,158,11,0.3)] transition-all duration-300"
                      style={{ width: `${totalMeetings ? (processingMeetings / totalMeetings) * 100 : 0}%` }}
                    />
                  </div>
                </div>
              )}

              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-medium">
                  <span className="text-[#5A6E7F]">Action Item Completion</span>
                  <span className="text-[#172B3A] font-semibold">
                    {actionItems.length ? Math.round((completedActionItems / actionItems.length) * 100) : 0}%
                  </span>
                </div>
                <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden p-0.5 border border-[#648296]/10 shadow-[inset_0_1px_2px_rgba(23,43,58,0.06)]">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-600 to-teal-500 rounded-full shadow-[0_1px_2px_rgba(16,185,129,0.3)] transition-all duration-300"
                    style={{ width: `${actionItems.length ? (completedActionItems / actionItems.length) * 100 : 0}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-[#648296]/14 flex items-center justify-between text-xs text-[#718096]">
            <span>Active deliverables:</span>
            <span className="font-semibold text-[#172B3A]">{openActionItems} open</span>
          </div>
        </GlassCard>

        {/* Right Column (2 Cols): Pending Action Items */}
        <GlassCard className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#648296]/14">
            <div>
              <h3 className="font-bold text-[#172B3A] text-sm">Action Items Needing Attention</h3>
              <p className="text-xs text-[#718096]">Deliverables extracted from your meetings</p>
            </div>

            <Link
              to="/action-items"
              className="text-xs font-semibold text-[#168AAD] hover:text-[#13728F] flex items-center gap-1 transition-colors"
            >
              <span>View all</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {actionItems.length === 0 ? (
            <div className="py-8 text-center text-[#718096] text-xs">
              <p>No action items found. Analyze a meeting to generate tasks and follow-ups.</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {actionItems.slice(0, 4).map((item) => (
                <div
                  key={item.id}
                  className="flex items-start gap-3 p-3.5 rounded-xl bg-white/75 hover:bg-white border border-[#648296]/14 hover:border-[#168AAD]/30 shadow-[0_1px_2px_rgba(23,43,58,0.02),inset_0_1px_0_0_rgba(255,255,255,0.9)] hover:shadow-[0_4px_12px_rgba(23,43,58,0.04)] transition-all duration-180"
                >
                  <button
                    onClick={() => toggleTaskStatus(item.id, item.status)}
                    className="mt-0.5 text-[#718096] hover:text-emerald-600 transition-colors cursor-pointer flex-shrink-0"
                    title={item.status === 'DONE' ? 'Mark as Open' : 'Mark as Done'}
                  >
                    {item.status === 'DONE' ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <Circle className="w-4 h-4 text-[#718096]" />
                    )}
                  </button>

                  <div className="flex-1 min-w-0">
                    <p className={`text-xs sm:text-sm font-medium ${item.status === 'DONE' ? 'line-through text-[#718096]' : 'text-[#172B3A]'}`}>
                      {item.description}
                    </p>
                    <div className="flex items-center gap-2 mt-1 text-[11px] text-[#718096]">
                      {item.assignee && (
                        <span>Assignee: <strong className="text-[#172B3A] font-medium">{item.assignee}</strong></span>
                      )}
                      {item.dueDate && (
                        <>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {item.dueDate}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full shadow-[inset_0_1px_0_0_rgba(255,255,255,0.7)] ${
                    item.status === 'DONE'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-amber-50 text-amber-700 border border-amber-200'
                  }`}>
                    {item.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </GlassCard>
      </div>

      {/* Recent Meetings Table / Compact List */}
      <GlassCard padding="none" className="overflow-hidden">
        <div className="p-5 sm:p-6 border-b border-[#648296]/14 flex items-center justify-between bg-gradient-to-r from-transparent via-white/40 to-transparent">
          <div>
            <h2 className="text-base font-bold text-[#172B3A]">Recent Meetings</h2>
            <p className="text-xs text-[#718096] mt-0.5">Your analyzed transcripts and summaries</p>
          </div>

          <Link
            to="/meetings"
            className="text-xs font-semibold text-[#168AAD] hover:text-[#13728F] flex items-center gap-1 transition-colors"
          >
            <span>View all meetings</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {meetings.length === 0 ? (
          <div className="p-8">
            <EmptyState
              icon={Video}
              title="No meetings recorded yet"
              description="Start by creating your first meeting to get an executive summary, action items, and email draft."
              actionLabel="New Meeting"
              onAction={() => window.location.href = '/meetings/new'}
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-[#EAF1F6]/75 text-[#5A6E7F] text-[11px] font-semibold uppercase tracking-wider border-b border-[#648296]/14">
                <tr>
                  <th className="py-3 px-5">Title</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#648296]/14">
                {meetings.slice(0, 5).map((m) => (
                  <tr key={m.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-5">
                      <Link
                        to={`/meetings/${m.id}`}
                        className="font-medium text-[#172B3A] hover:text-[#168AAD] transition-colors"
                      >
                        {m.title}
                      </Link>
                    </td>
                    <td className="py-3.5 px-4 text-xs text-[#718096] whitespace-nowrap">
                      {new Date(m.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <StatusBadge status={m.status} />
                    </td>
                    <td className="py-3.5 px-5 text-right whitespace-nowrap">
                      <Link
                        to={`/meetings/${m.id}`}
                        className="text-xs font-semibold text-[#168AAD] hover:text-[#13728F] transition-colors"
                      >
                        Open details →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </GlassCard>
    </div>
  )
}
