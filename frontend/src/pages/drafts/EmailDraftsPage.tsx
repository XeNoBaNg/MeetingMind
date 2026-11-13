import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useMeetings, useMeeting } from '../../hooks/useMeetings'
import {
  Mail,
  Copy,
  Check,
  Calendar,
  ExternalLink
} from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import { GlassCard } from '../../components/common/GlassCard'
import { Button } from '../../components/common/Button'
import { EmptyState } from '../../components/common/EmptyState'
import { PageSkeleton } from '../../components/common/LoadingSkeleton'

export function EmailDraftsPage() {
  const { data: meetingsData, isLoading: meetingsLoading } = useMeetings()

  // Filter meetings that have been analyzed (COMPLETED)
  const completedMeetings = useMemo(() => {
    return (meetingsData?.data || []).filter(m => m.status === 'COMPLETED')
  }, [meetingsData?.data])

  const [selectedMeetingId, setSelectedMeetingId] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  // Default to first completed meeting
  const activeMeetingId = selectedMeetingId || (completedMeetings.length > 0 ? completedMeetings[0].id : null)

  const { data: detailData, isLoading: detailLoading } = useMeeting(activeMeetingId || '')
  const meetingDetail = detailData?.data
  const draft = meetingDetail?.emailDraft

  const handleCopy = () => {
    if (draft?.body) {
      navigator.clipboard.writeText(draft.body)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    }
  }

  if (meetingsLoading) {
    return <PageSkeleton />
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#172B3A] tracking-tight">
          Follow-up Email Drafts
        </h1>
        <p className="text-xs sm:text-sm text-[#5A6E7F] mt-1">
          Review, copy, and send follow-up communications drafted from meeting action items.
        </p>
      </div>

      {completedMeetings.length === 0 ? (
        <EmptyState
          icon={Mail}
          title="No follow-up drafts generated yet"
          description="When meetings are analyzed, polished follow-up email drafts will appear here ready to review and copy."
          actionLabel="New Meeting"
          onAction={() => window.location.href = '/meetings/new'}
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[550px]">
          {/* Left Column: List of Meetings with Drafts (4 cols) */}
          <div className="lg:col-span-4 space-y-2.5">
            <div className="px-1 text-xs font-bold uppercase tracking-wider text-[#718096]">
              Meetings with Drafts ({completedMeetings.length})
            </div>

            <div className="space-y-2">
              {completedMeetings.map((m) => {
                const isActive = m.id === activeMeetingId
                return (
                  <button
                    key={m.id}
                    onClick={() => setSelectedMeetingId(m.id)}
                    className={`
                      w-full text-left p-4 rounded-xl transition-all duration-150 border cursor-pointer
                      ${
                        isActive
                          ? 'bg-gradient-to-r from-white to-[#EAF1F6]/50 border-[#168AAD] shadow-[0_2px_8px_-2px_rgba(20,123,155,0.18),inset_0_1px_0_0_#ffffff] ring-1 ring-[#168AAD]/30 font-semibold'
                          : 'bg-white/75 hover:bg-white border-[#648296]/14 shadow-[0_1px_2px_rgba(23,43,58,0.02),inset_0_1px_0_0_rgba(255,255,255,0.8)] hover:shadow-sm hover:border-[#648296]/25'
                      }
                    `}
                  >
                    <h3 className={`text-sm font-semibold truncate ${isActive ? 'text-[#168AAD]' : 'text-[#172B3A]'}`}>
                      {m.title}
                    </h3>
                    <div className="flex items-center gap-2 mt-1.5 text-xs text-[#718096]">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>
                        {new Date(m.createdAt).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </span>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Right Column: Active Draft Preview (8 cols) */}
          <div className="lg:col-span-8">
            {detailLoading ? (
              <GlassCard className="h-full flex items-center justify-center p-12">
                <p className="text-xs text-[#718096]">Loading email draft...</p>
              </GlassCard>
            ) : !draft ? (
              <GlassCard className="h-full flex items-center justify-center p-12 text-center text-[#718096] text-xs">
                <p>No draft generated for this meeting yet.</p>
              </GlassCard>
            ) : (
              <GlassCard padding="none" className="h-full flex flex-col overflow-hidden">
                {/* Draft Action Bar */}
                <div className="p-5 sm:p-6 border-b border-[#648296]/14 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#EAF1F6]/40">
                  <div>
                    <span className="text-[10px] font-bold text-[#168AAD] uppercase tracking-wider block">
                      Meeting Follow-up
                    </span>
                    <h2 className="text-base sm:text-lg font-bold text-[#172B3A] line-clamp-1">
                      {meetingDetail?.title}
                    </h2>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Button
                      variant="primary"
                      size="sm"
                      icon={copied ? Check : Copy}
                      onClick={handleCopy}
                    >
                      {copied ? 'Copied to Clipboard' : 'Copy Draft'}
                    </Button>

                    <Link to={`/meetings/${activeMeetingId}`}>
                      <Button variant="secondary" size="sm" icon={ExternalLink}>
                        Open Meeting
                      </Button>
                    </Link>
                  </div>
                </div>

                {/* Email Content Canvas */}
                <div className="p-6 sm:p-8 flex-1 space-y-6 overflow-y-auto custom-scrollbar bg-white">
                  {/* Subject Line */}
                  <div className="space-y-1 pb-4 border-b border-[#648296]/14">
                    <span className="text-xs font-semibold text-[#718096] uppercase tracking-wider">
                      Subject
                    </span>
                    <p className="text-sm sm:text-base font-bold text-[#172B3A]">
                      {draft.subject || 'Meeting Summary & Action Items'}
                    </p>
                  </div>

                  {/* Body Content */}
                  <div className="space-y-2">
                    <span className="text-xs font-semibold text-[#718096] uppercase tracking-wider block">
                      Email Body
                    </span>
                    <div className="prose prose-slate max-w-none text-xs sm:text-sm text-[#172B3A] leading-relaxed p-4 rounded-xl bg-[#F4F7FA] border border-[#648296]/14 shadow-[inset_0_1px_2px_rgba(23,43,58,0.03)]">
                      <ReactMarkdown>{draft.body}</ReactMarkdown>
                    </div>
                  </div>
                </div>
              </GlassCard>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
