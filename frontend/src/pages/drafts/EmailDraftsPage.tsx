import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useMeetings, useMeeting } from '../../hooks/useMeetings'
import {
  Mail,
  Copy,
  Check,
  Clock,
  Sparkles,
  ExternalLink,
  ChevronRight,
  Inbox
} from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import { GlassCard } from '../../components/common/GlassCard'
import { Button } from '../../components/common/Button'
import { Badge } from '../../components/common/Badge'
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
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 shadow-md">
            <Mail className="w-5 h-5" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Follow-up Email Drafts
          </h1>
        </div>
        <p className="text-sm text-slate-400 mt-1">
          Review, copy, and send AI-generated executive follow-up communications drafted from meeting action items.
        </p>
      </div>

      {completedMeetings.length === 0 ? (
        <EmptyState
          icon={Mail}
          title="No follow-up drafts generated yet"
          description="When your meetings are analyzed by the 4-agent pipeline, Drafter Agent creates polished follow-up emails ready to be copied or sent."
          actionLabel="Analyze New Meeting"
          onAction={() => window.location.href = '/meetings/new'}
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[600px]">
          {/* Left Column: List of Meetings with Drafts (4 cols) */}
          <div className="lg:col-span-4 space-y-3">
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Generated Drafts ({completedMeetings.length})
              </span>
            </div>

            <div className="space-y-2.5">
              {completedMeetings.map((m) => {
                const isActive = m.id === activeMeetingId
                return (
                  <button
                    key={m.id}
                    onClick={() => setSelectedMeetingId(m.id)}
                    className={`
                      w-full text-left p-4 rounded-2xl transition-all duration-200 border cursor-pointer
                      ${
                        isActive
                          ? 'bg-[#0e223d]/90 border-cyan-500/40 shadow-lg shadow-cyan-950/40'
                          : 'bg-[#0b1728]/60 hover:bg-[#0b1728]/90 border-white/[0.08] hover:border-white/20'
                      }
                    `}
                  >
                    <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5 font-mono">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-cyan-400" />
                        {new Date(m.createdAt).toLocaleDateString()}
                      </span>
                      <span className="text-emerald-400 font-sans font-medium">Ready</span>
                    </div>

                    <h4 className="font-bold text-white text-sm line-clamp-1 mb-2">
                      {m.title || 'Untitled Meeting'}
                    </h4>

                    <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-white/[0.06]">
                      <span className="text-[11px] text-cyan-300 font-medium">Drafter Agent #3</span>
                      <ChevronRight className={`w-3.5 h-3.5 transition-transform ${isActive ? 'translate-x-1 text-cyan-400' : ''}`} />
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Right Column: Email Client / Editor View (8 cols) */}
          <div className="lg:col-span-8">
            <GlassCard padding="none" className="h-full flex flex-col justify-between overflow-hidden">
              {detailLoading ? (
                <div className="p-10 space-y-4">
                  <div className="h-8 w-64 bg-white/5 rounded-xl animate-pulse" />
                  <div className="h-4 w-40 bg-white/5 rounded-xl animate-pulse" />
                  <div className="h-64 w-full bg-white/5 rounded-2xl animate-pulse" />
                </div>
              ) : draft ? (
                <>
                  {/* Top Bar of Editor */}
                  <div className="p-6 border-b border-white/[0.08] bg-white/[0.02] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Badge variant="cyan" size="sm">Follow-up Draft</Badge>
                        <span className="text-xs text-slate-400">
                          From "{meetingDetail?.title}"
                        </span>
                      </div>
                      <h2 className="text-lg font-bold text-white tracking-tight">
                        {draft.subject}
                      </h2>
                    </div>

                    <div className="flex items-center gap-2">
                      <Link to={`/meetings/${meetingDetail?.id}`}>
                        <Button variant="secondary" size="sm" icon={ExternalLink}>
                          Meeting
                        </Button>
                      </Link>
                      <Button
                        variant="primary"
                        size="sm"
                        icon={copied ? Check : Copy}
                        onClick={handleCopy}
                      >
                        {copied ? 'Copied to Clipboard' : 'Copy Email'}
                      </Button>
                    </div>
                  </div>

                  {/* Recipient suggestions */}
                  <div className="px-6 py-3 border-b border-white/[0.06] bg-[#07101d] flex flex-wrap items-center gap-2 text-xs">
                    <span className="font-semibold text-slate-400">Suggested Recipients:</span>
                    {draft.recipientSuggestions && draft.recipientSuggestions.length > 0 ? (
                      draft.recipientSuggestions.map((rec, i) => (
                        <span
                          key={i}
                          className="px-2.5 py-1 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 font-mono text-xs"
                        >
                          {rec}
                        </span>
                      ))
                    ) : (
                      <span className="text-slate-400 italic">All meeting participants</span>
                    )}
                  </div>

                  {/* Email Body Content */}
                  <div className="p-6 sm:p-8 flex-1 bg-[#091424]/80 overflow-y-auto custom-scrollbar">
                    <div className="prose prose-invert max-w-none text-sm sm:text-base leading-relaxed text-slate-200">
                      <ReactMarkdown>{draft.body}</ReactMarkdown>
                    </div>
                  </div>

                  {/* Footer status */}
                  <div className="p-4 border-t border-white/[0.08] bg-[#07101d] flex items-center justify-between text-xs text-slate-400">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Drafted by Drafter Agent • Audited by Reviewer Agent</span>
                    </div>
                    <span className="font-mono">{draft.body ? `${draft.body.split(/\s+/).length} words` : ''}</span>
                  </div>
                </>
              ) : (
                <div className="p-16 text-center text-slate-400 flex flex-col items-center justify-center h-full">
                  <Inbox className="w-12 h-12 text-slate-600 mb-3" />
                  <p className="text-base font-semibold text-white">Select a meeting to view draft</p>
                  <p className="text-xs text-slate-400 mt-1">Choose an analyzed meeting from the left list.</p>
                </div>
              )}
            </GlassCard>
          </div>
        </div>
      )}
    </div>
  )
}
