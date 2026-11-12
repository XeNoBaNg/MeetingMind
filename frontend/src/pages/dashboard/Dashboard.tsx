import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useMeetings } from '../../hooks/useMeetings'
import { useActionItems, useUpdateActionItemStatus } from '../../hooks/useActionItems'
import { useAuth } from '../../features/auth/AuthContext'
import {
  Video,
  Sparkles,
  ListTodo,
  CheckCircle2,
  Clock,
  ArrowRight,
  TrendingUp,
  Circle,
  Plus,
  Bot,
  Layers,
  Calendar
} from 'lucide-react'
import { StatCard } from '../../components/common/StatCard'
import { GlassCard } from '../../components/common/GlassCard'
import { StatusBadge, Badge } from '../../components/common/Badge'
import { Button } from '../../components/common/Button'
import { EmptyState } from '../../components/common/EmptyState'
import { PageSkeleton } from '../../components/common/LoadingSkeleton'

export function Dashboard() {
  const { user } = useAuth()
  const { data: meetingsData, isLoading: meetingsLoading, error: meetingsError } = useMeetings()
  const { data: actionItemsData, isLoading: actionItemsLoading } = useActionItems()
  const { mutate: updateStatus } = useUpdateActionItemStatus()

  // Time of day greeting
  const greeting = useMemo(() => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good morning'
    if (hour < 18) return 'Good afternoon'
    return 'Good evening'
  }, [])

  if (meetingsLoading || actionItemsLoading) {
    return <PageSkeleton />
  }

  if (meetingsError) {
    return (
      <GlassCard className="border-rose-500/30 bg-rose-500/5">
        <h2 className="text-lg font-bold text-rose-400 mb-1">Failed to load dashboard data</h2>
        <p className="text-sm text-slate-400">{meetingsError.message}</p>
      </GlassCard>
    )
  }

  const meetings = meetingsData?.data || []
  const actionItems = actionItemsData?.data || []

  const totalMeetings = meetings.length
  const completedMeetings = meetings.filter(m => m.status === 'COMPLETED').length
  const analyzingMeetings = meetings.filter(m => m.status !== 'COMPLETED' && m.status !== 'FAILED').length
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
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-300">
      {/* Top Greeting & Quick Action Banner */}
      <div className="relative rounded-3xl bg-gradient-to-r from-cyan-900/30 via-[#0b1b33] to-[#081324] border border-cyan-500/20 p-6 sm:p-8 overflow-hidden shadow-2xl">
        {/* Atmospheric Glow */}
        <div className="absolute -right-10 -bottom-10 w-80 h-80 bg-cyan-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-0 right-1/4 w-60 h-60 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>Multi-Agent AI Studio</span>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight">
              {greeting}, {user?.username || 'Executive'}
            </h1>
            <p className="text-sm sm:text-base text-slate-300 max-w-2xl leading-relaxed">
              MeetingMind has processed your meetings through the 4-agent pipeline. Track deliverables, summaries, and action items in real time.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link to="/meetings/new">
              <Button variant="primary" icon={Plus}>
                New Analysis
              </Button>
            </Link>
            <Link to="/search">
              <Button variant="secondary" icon={Bot}>
                Ask RAG
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          title="Total Meetings"
          value={totalMeetings}
          icon={Video}
          color="cyan"
          change={totalMeetings > 0 ? `${totalMeetings} recorded` : 'Ready to start'}
          trend="up"
          subtitle="All sessions"
        />
        <StatCard
          title="Analyzed"
          value={completedMeetings}
          icon={Sparkles}
          color="emerald"
          change={`${completionRate}% verified`}
          trend={completionRate > 50 ? 'up' : 'neutral'}
          subtitle="4-agent pipeline"
        />
        <StatCard
          title="Pending Tasks"
          value={openActionItems}
          icon={ListTodo}
          color="amber"
          change={openActionItems > 0 ? `${openActionItems} awaiting action` : 'All caught up!'}
          trend={openActionItems > 0 ? 'neutral' : 'up'}
          subtitle="From all meetings"
        />
        <StatCard
          title="Completed Tasks"
          value={completedActionItems}
          icon={CheckCircle2}
          color="blue"
          change={`${completedActionItems} tasks resolved`}
          trend="up"
          subtitle="Deliverables closed"
        />
      </div>

      {/* Analytics & Meeting Pipeline Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Pipeline Analytics & Progress Breakdown */}
        <GlassCard className="lg:col-span-1 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm">Pipeline Health</h3>
                  <p className="text-xs text-slate-400">Analysis status distribution</p>
                </div>
              </div>
              <Badge variant="cyan" size="sm">Live</Badge>
            </div>

            {/* Visual Progress Bar */}
            <div className="mt-6 space-y-4">
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-medium">
                  <span className="text-slate-300">Completed Analyses</span>
                  <span className="text-emerald-400">{completedMeetings} / {totalMeetings}</span>
                </div>
                <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden p-0.5 border border-white/5">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-500"
                    style={{ width: `${totalMeetings ? (completedMeetings / totalMeetings) * 100 : 0}%` }}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-medium">
                  <span className="text-slate-300">Processing in Kafka / Agents</span>
                  <span className="text-amber-400">{analyzingMeetings}</span>
                </div>
                <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden p-0.5 border border-white/5">
                  <div
                    className="h-full bg-gradient-to-r from-amber-500 to-yellow-400 rounded-full transition-all duration-500"
                    style={{ width: `${totalMeetings ? (analyzingMeetings / totalMeetings) * 100 : 0}%` }}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-medium">
                  <span className="text-slate-300">Action Item Completion</span>
                  <span className="text-cyan-400">
                    {actionItems.length ? Math.round((completedActionItems / actionItems.length) * 100) : 0}%
                  </span>
                </div>
                <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden p-0.5 border border-white/5">
                  <div
                    className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full transition-all duration-500"
                    style={{ width: `${actionItems.length ? (completedActionItems / actionItems.length) * 100 : 0}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Quick Info Box */}
          <div className="mt-8 pt-5 border-t border-white/[0.08] flex items-center justify-between text-xs">
            <span className="text-slate-400">Orchestrator:</span>
            <span className="font-semibold text-cyan-300">Sequential Multi-Agent (4x)</span>
          </div>
        </GlassCard>

        {/* Right: Quick Action Items */}
        <GlassCard className="lg:col-span-2">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                <ListTodo className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-white text-base">Deliverables & Action Items</h3>
                <p className="text-xs text-slate-400">Tasks assigned across recent meetings</p>
              </div>
            </div>

            <Link
              to="/action-items"
              className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 group transition-colors"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>

          {actionItems.length === 0 ? (
            <div className="py-8 text-center text-slate-400 text-sm">
              <p>No action items extracted yet. Run a meeting analysis to generate tasks.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {actionItems.slice(0, 4).map((item) => (
                <div
                  key={item.id}
                  className="flex items-start gap-3 p-3.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.06] hover:border-cyan-500/20 transition-all duration-200"
                >
                  <button
                    onClick={() => toggleTaskStatus(item.id, item.status)}
                    className="mt-0.5 text-slate-400 hover:text-cyan-400 transition-colors flex-shrink-0 cursor-pointer"
                    aria-label={item.status === 'OPEN' ? 'Mark as done' : 'Reopen'}
                  >
                    {item.status === 'DONE' ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    ) : (
                      <Circle className="w-5 h-5" />
                    )}
                  </button>

                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium ${item.status === 'DONE' ? 'line-through text-slate-400' : 'text-white'}`}>
                      {item.description}
                    </p>
                    <div className="flex flex-wrap items-center gap-2 mt-1.5 text-xs text-slate-400">
                      {item.assignee && (
                        <span className="px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-300 font-medium border border-cyan-500/20">
                          {item.assignee}
                        </span>
                      )}
                      {item.dueDate && (
                        <span className="flex items-center gap-1 text-slate-400">
                          <Clock className="w-3.5 h-3.5" />
                          {item.dueDate}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </GlassCard>
      </div>

      {/* Recent Meetings Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
              <Video className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight">Recent Meetings</h2>
              <p className="text-xs text-slate-400">Transcripts processed and AI synthesis results</p>
            </div>
          </div>

          <Link
            to="/meetings"
            className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 group transition-colors"
          >
            <span>Browse All Meetings</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>

        {meetings.length === 0 ? (
          <EmptyState
            icon={Calendar}
            title="No meetings recorded yet"
            description="Paste a meeting transcript to let the 4-agent AI pipeline summarize decisions, extract deliverables, and draft follow-up communications."
            actionLabel="Analyze your first meeting"
            onAction={() => window.location.href = '/meetings/new'}
            actionIcon={Plus}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {meetings.slice(0, 6).map((meeting) => (
              <Link
                key={meeting.id}
                to={`/meetings/${meeting.id}`}
                className="group"
              >
                <GlassCard
                  className="h-full flex flex-col justify-between hover:border-cyan-500/35 group-hover:shadow-cyan-500/10"
                  padding="md"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <StatusBadge status={meeting.status} />
                      <span className="text-xs text-slate-400 flex items-center gap-1 font-mono">
                        <Clock className="w-3 h-3" />
                        {new Date(meeting.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    <h3 className="font-bold text-white text-base group-hover:text-cyan-300 transition-colors line-clamp-2">
                      {meeting.title || 'Untitled Meeting'}
                    </h3>
                  </div>

                  <div className="mt-5 pt-4 border-t border-white/[0.08] flex items-center justify-between text-xs text-slate-400">
                    <span className="flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Pipeline Detail</span>
                    </span>
                    <span className="text-cyan-400 group-hover:translate-x-1 transition-transform flex items-center gap-1 font-semibold">
                      <span>View</span>
                      <ArrowRight className="w-3 h-3" />
                    </span>
                  </div>
                </GlassCard>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
