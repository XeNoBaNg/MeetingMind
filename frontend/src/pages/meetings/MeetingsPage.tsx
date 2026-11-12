import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useMeetings, useDeleteMeeting } from '../../hooks/useMeetings'
import {
  Video,
  Search,
  Plus,
  Clock,
  ArrowRight,
  Layers,
  Trash2,
  LayoutGrid,
  List,
  Calendar,
  AlertCircle
} from 'lucide-react'
import { GlassCard } from '../../components/common/GlassCard'
import { StatusBadge } from '../../components/common/Badge'
import { Button } from '../../components/common/Button'
import { EmptyState } from '../../components/common/EmptyState'
import { PageSkeleton } from '../../components/common/LoadingSkeleton'
import { Modal } from '../../components/common/Modal'

export function MeetingsPage() {
  const { data, isLoading, error } = useMeetings()
  const deleteMutation = useDeleteMeeting()

  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('ALL')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [meetingToDelete, setMeetingToDelete] = useState<{ id: string; title: string } | null>(null)

  // Filter meetings by search query & status
  const filteredMeetings = useMemo(() => {
    return (data?.data || []).filter(m => {
      const matchesSearch = !searchQuery.trim() || 
        m.title.toLowerCase().includes(searchQuery.toLowerCase().trim())
      
      const matchesStatus = statusFilter === 'ALL' || 
        (statusFilter === 'ANALYZING' ? (m.status !== 'COMPLETED' && m.status !== 'FAILED') : m.status === statusFilter)

      return matchesSearch && matchesStatus
    })
  }, [data?.data, searchQuery, statusFilter])

  if (isLoading) {
    return <PageSkeleton />
  }

  if (error) {
    return (
      <GlassCard className="border-rose-500/30 bg-rose-500/5">
        <div className="flex items-center gap-3 text-rose-400 mb-2">
          <AlertCircle className="w-5 h-5" />
          <h2 className="text-lg font-bold">Failed to load meetings</h2>
        </div>
        <p className="text-sm text-slate-400">{error.message}</p>
      </GlassCard>
    )
  }

  const handleDeleteConfirm = () => {
    if (!meetingToDelete) return
    deleteMutation.mutate(meetingToDelete.id, {
      onSuccess: () => {
        setMeetingToDelete(null)
      }
    })
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-300">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 shadow-md">
              <Video className="w-5 h-5" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Meetings Intelligence
            </h1>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Browse, filter, and inspect your analyzed meeting transcripts and multi-agent outputs.
          </p>
        </div>

        <Link to="/meetings/new">
          <Button variant="primary" icon={Plus}>
            New Meeting
          </Button>
        </Link>
      </div>

      {/* Control Bar: Search & Status Filter */}
      <GlassCard padding="sm" className="space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search meetings by title..."
              className="w-full h-10 pl-10 pr-4 rounded-xl bg-[#081220]/70 border border-white/10 text-sm text-white placeholder-slate-400 focus:outline-none focus:border-cyan-500/60 focus:ring-2 focus:ring-cyan-500/20 transition-all"
            />
          </div>

          {/* Filter Pills & View Toggle */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <div className="flex items-center rounded-xl bg-[#081220]/80 p-1 border border-white/10">
              {(['ALL', 'COMPLETED', 'ANALYZING', 'FAILED'] as const).map((status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    statusFilter === status
                      ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {status === 'ALL' ? 'All' : status === 'ANALYZING' ? 'Processing' : status.charAt(0) + status.slice(1).toLowerCase()}
                </button>
              ))}
            </div>

            {/* Grid / List View Toggle */}
            <div className="flex items-center rounded-xl bg-[#081220]/80 p-1 border border-white/10">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg transition-colors ${
                  viewMode === 'grid' ? 'bg-cyan-500/20 text-cyan-300' : 'text-slate-400 hover:text-white'
                }`}
                title="Grid View"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-lg transition-colors ${
                  viewMode === 'list' ? 'bg-cyan-500/20 text-cyan-300' : 'text-slate-400 hover:text-white'
                }`}
                title="List View"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </GlassCard>

      {/* Meetings Content */}
      {filteredMeetings.length === 0 ? (
        <EmptyState
          icon={Calendar}
          title={searchQuery || statusFilter !== 'ALL' ? 'No matching meetings found' : 'No meetings analyzed yet'}
          description={
            searchQuery || statusFilter !== 'ALL'
              ? 'Try modifying your search query or status filter to see other meetings.'
              : 'Paste your raw transcript into the AI pipeline to extract summaries, key decisions, and action items.'
          }
          actionLabel="Analyze New Meeting"
          onAction={() => window.location.href = '/meetings/new'}
          actionIcon={Plus}
        />
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMeetings.map((meeting) => (
            <GlassCard
              key={meeting.id}
              className="flex flex-col justify-between hover:border-cyan-500/35 transition-all group"
              padding="md"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <StatusBadge status={meeting.status} />
                  <span className="text-xs text-slate-400 flex items-center gap-1 font-mono">
                    <Clock className="w-3.5 h-3.5" />
                    {new Date(meeting.createdAt).toLocaleDateString()}
                  </span>
                </div>

                <Link to={`/meetings/${meeting.id}`}>
                  <h3 className="font-bold text-white text-base group-hover:text-cyan-300 transition-colors line-clamp-2">
                    {meeting.title || 'Untitled Meeting'}
                  </h3>
                </Link>
              </div>

              <div className="mt-6 pt-4 border-t border-white/[0.08] flex items-center justify-between">
                <Link
                  to={`/meetings/${meeting.id}`}
                  className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 flex items-center gap-1.5 group-hover:translate-x-1 transition-transform"
                >
                  <span>Open Intelligence</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>

                <button
                  onClick={() => setMeetingToDelete({ id: meeting.id, title: meeting.title })}
                  className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                  title="Delete Meeting"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </GlassCard>
          ))}
        </div>
      ) : (
        /* List View */
        <GlassCard padding="none" className="overflow-hidden">
          <div className="divide-y divide-white/[0.06]">
            {filteredMeetings.map((meeting) => (
              <div
                key={meeting.id}
                className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-white/[0.02] transition-colors group"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1.5">
                    <StatusBadge status={meeting.status} />
                    <span className="text-xs text-slate-400 flex items-center gap-1 font-mono">
                      <Clock className="w-3 h-3" />
                      {new Date(meeting.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <Link to={`/meetings/${meeting.id}`}>
                    <h3 className="font-bold text-white text-base group-hover:text-cyan-300 transition-colors truncate">
                      {meeting.title || 'Untitled Meeting'}
                    </h3>
                  </Link>
                </div>

                <div className="flex items-center gap-3 self-end sm:self-center">
                  <Link to={`/meetings/${meeting.id}`}>
                    <Button variant="secondary" size="sm" icon={Layers}>
                      Inspect
                    </Button>
                  </Link>
                  <button
                    onClick={() => setMeetingToDelete({ id: meeting.id, title: meeting.title })}
                    className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-colors cursor-pointer"
                    title="Delete Meeting"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </GlassCard>
      )}

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!meetingToDelete}
        onClose={() => setMeetingToDelete(null)}
        title="Permanently delete meeting?"
        description="This will permanently delete this meeting and all AI-generated outputs."
      >
        <div className="space-y-4">
          <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300">
            Are you sure you want to delete <span className="font-bold text-white">"{meetingToDelete?.title}"</span>?
            This removes the summary, extracted action items, follow-up emails, and vector RAG embeddings permanently.
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button
              variant="secondary"
              onClick={() => setMeetingToDelete(null)}
              disabled={deleteMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleDeleteConfirm}
              loading={deleteMutation.isPending}
              icon={Trash2}
            >
              Delete Permanently
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
