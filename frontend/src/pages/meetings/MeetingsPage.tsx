import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useMeetings, useDeleteMeeting } from '../../hooks/useMeetings'
import {
  Video,
  Search,
  Plus,
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
      <GlassCard className="border-rose-300 bg-rose-50/60 text-rose-800">
        <div className="flex items-center gap-2 mb-1">
          <AlertCircle className="w-5 h-5 text-rose-600" />
          <h2 className="text-base font-bold">Failed to load meetings</h2>
        </div>
        <p className="text-xs text-rose-700">{error.message}</p>
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
    <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-200">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#172B3A] tracking-tight">
            Meetings
          </h1>
          <p className="text-xs sm:text-sm text-[#5A6E7F] mt-1">
            Browse, search, and manage your meetings, summaries, and action items.
          </p>
        </div>

        <Link to="/meetings/new">
          <Button variant="primary" icon={Plus}>
            New Meeting
          </Button>
        </Link>
      </div>

      {/* Control Bar: Search & Status Filter */}
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
              placeholder="Search meetings by title..."
              className="w-full h-9 pl-9 pr-4 rounded-xl bg-white border border-[#648296]/20 text-xs sm:text-sm text-[#172B3A] placeholder-[#718096] focus:outline-none focus:border-[#168AAD] focus:ring-2 focus:ring-[#168AAD]/15 shadow-[inset_0_1px_1.5px_rgba(23,43,58,0.025)] transition-all"
            />
          </div>

          {/* Filters & View Controls */}
          <div className="flex items-center gap-2.5 overflow-x-auto pb-1 md:pb-0">
            {/* Status Filter Chips */}
            <div className="flex items-center gap-1 bg-[#EAF1F6]/70 p-1 rounded-xl border border-[#648296]/14 text-xs font-medium shadow-[inset_0_1px_2px_rgba(23,43,58,0.04)]">
              {(['ALL', 'COMPLETED', 'ANALYZING', 'FAILED'] as const).map((status) => (
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
                  {status === 'ALL' ? 'All' : status === 'ANALYZING' ? 'Processing' : status === 'COMPLETED' ? 'Completed' : 'Failed'}
                </button>
              ))}
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center bg-[#EAF1F6]/70 p-1 rounded-xl border border-[#648296]/14 text-[#5A6E7F] shadow-[inset_0_1px_2px_rgba(23,43,58,0.04)]">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  viewMode === 'grid' ? 'bg-white text-[#172B3A] shadow-[0_1px_2px_rgba(23,43,58,0.06),inset_0_1px_0_0_#ffffff]' : 'hover:text-[#172B3A]'
                }`}
                title="Grid View"
                aria-label="Grid View"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  viewMode === 'list' ? 'bg-white text-[#172B3A] shadow-[0_1px_2px_rgba(23,43,58,0.06),inset_0_1px_0_0_#ffffff]' : 'hover:text-[#172B3A]'
                }`}
                title="List View"
                aria-label="List View"
              >
                <List className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </GlassCard>

      {/* Content Area */}
      {filteredMeetings.length === 0 ? (
        <EmptyState
          icon={Video}
          title={searchQuery ? 'No meetings matched your search' : 'No meetings found'}
          description={
            searchQuery
              ? `No meetings matching "${searchQuery}" with status ${statusFilter}. Try adjusting your search query.`
              : 'Submit a transcript to generate an executive summary, structured action items, and follow-up email.'
          }
          actionLabel={searchQuery ? undefined : 'New Meeting'}
          onAction={searchQuery ? undefined : () => window.location.href = '/meetings/new'}
        />
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredMeetings.map((m) => (
            <div
              key={m.id}
              className="group relative overflow-hidden flex flex-col justify-between rounded-2xl bg-gradient-to-b from-white/95 to-white/85 backdrop-blur-md border border-[#648296]/16 p-5 sm:p-6 shadow-[0_1px_3px_rgba(23,43,58,0.03),0_6px_16px_-4px_rgba(23,43,58,0.04),inset_0_1px_0_0_rgba(255,255,255,0.95)] hover:shadow-[0_8px_24px_-4px_rgba(23,43,58,0.08),inset_0_1px_0_0_rgba(255,255,255,1)] hover:border-[#168AAD]/30 hover:-translate-y-0.5 transition-all duration-200"
            >
              {/* Subtle top edge light reflection */}
              <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/90 to-transparent pointer-events-none" />

              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <StatusBadge status={m.status} />

                  <button
                    onClick={() => setMeetingToDelete({ id: m.id, title: m.title })}
                    className="p-1 rounded-lg text-[#718096] hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                    title="Delete meeting"
                    aria-label="Delete meeting"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <Link
                  to={`/meetings/${m.id}`}
                  className="block font-bold text-base text-[#172B3A] hover:text-[#168AAD] transition-colors leading-snug line-clamp-2"
                >
                  {m.title}
                </Link>

                <div className="flex items-center gap-2 text-xs text-[#718096] mt-3">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>
                    {new Date(m.createdAt).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </span>
                </div>
              </div>

              <div className="pt-4 mt-5 border-t border-[#648296]/14 flex items-center justify-between">
                <span className="text-[11px] text-[#718096]">
                  {m.status === 'COMPLETED' ? 'Analysis Complete' : m.status === 'FAILED' ? 'Failed' : 'Processing'}
                </span>

                <Link
                  to={`/meetings/${m.id}`}
                  className="text-xs font-semibold text-[#168AAD] hover:text-[#13728F] flex items-center gap-1 transition-colors"
                >
                  <span>View Details</span>
                  <span>→</span>
                </Link>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <GlassCard padding="none" className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-[#EAF1F6]/70 text-[#5A6E7F] text-[11px] font-semibold uppercase tracking-wider border-b border-[#648296]/14">
                <tr>
                  <th className="py-3 px-5">Title</th>
                  <th className="py-3 px-4">Created Date</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#648296]/14">
                {filteredMeetings.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-5">
                      <Link
                        to={`/meetings/${m.id}`}
                        className="font-medium text-[#172B3A] hover:text-[#168AAD] transition-colors line-clamp-1"
                      >
                        {m.title}
                      </Link>
                    </td>
                    <td className="py-3.5 px-4 text-xs text-[#718096] whitespace-nowrap">
                      {new Date(m.createdAt).toLocaleString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <StatusBadge status={m.status} />
                    </td>
                    <td className="py-3.5 px-5 text-right whitespace-nowrap space-x-3">
                      <Link
                        to={`/meetings/${m.id}`}
                        className="text-xs font-semibold text-[#168AAD] hover:text-[#13728F] transition-colors"
                      >
                        Details
                      </Link>
                      <button
                        onClick={() => setMeetingToDelete({ id: m.id, title: m.title })}
                        className="text-xs text-rose-600 hover:text-rose-800 transition-colors cursor-pointer"
                        title="Delete meeting"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </GlassCard>
      )}

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={Boolean(meetingToDelete)}
        onClose={() => setMeetingToDelete(null)}
        title="Delete Meeting"
        maxWidth="sm"
      >
        <div className="space-y-4">
          <p className="text-xs sm:text-sm text-[#5A6E7F] leading-relaxed">
            Are you sure you want to delete <strong className="text-[#172B3A]">"{meetingToDelete?.title}"</strong>?
            This will permanently remove the summary, action items, and email draft.
          </p>

          <div className="flex items-center justify-end gap-3 pt-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setMeetingToDelete(null)}
              disabled={deleteMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={handleDeleteConfirm}
              loading={deleteMutation.isPending}
            >
              Delete
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
