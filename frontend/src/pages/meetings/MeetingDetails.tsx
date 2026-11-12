import { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { useMeeting, useDeleteMeeting, meetingKeys } from '../../hooks/useMeetings'
import {
  CheckCircle2,
  Circle,
  AlertCircle,
  Copy,
  Mail,
  ListTodo,
  FileText,
  Activity,
  Trash2,
  Clock,
  ShieldCheck,
  ChevronRight,
  Check,
  Code2,
  ChevronDown,
  ChevronUp,
  Bot
} from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import { GlassCard } from '../../components/common/GlassCard'
import { Badge, StatusBadge } from '../../components/common/Badge'
import { Button } from '../../components/common/Button'
import { Modal } from '../../components/common/Modal'
import { PageSkeleton } from '../../components/common/LoadingSkeleton'

const PIPELINE_STAGES = [
  { id: 'ANALYZING', label: 'Queued', order: 0 },
  { id: 'SUMMARIZING', label: 'Summarizer Agent', order: 1 },
  { id: 'EXTRACTING', label: 'Extractor Agent', order: 2 },
  { id: 'DRAFTING', label: 'Drafter Agent', order: 3 },
  { id: 'REVIEWING', label: 'Reviewer Agent', order: 4 },
  { id: 'COMPLETED', label: 'Verification Complete', order: 5 }
]

export function MeetingDetails() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data, isLoading, error } = useMeeting(id!)
  const deleteMutation = useDeleteMeeting()
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [copiedDraft, setCopiedDraft] = useState(false)
  const [showTranscript, setShowTranscript] = useState(false)
  const queryClient = useQueryClient()
  const sseConnected = useRef(false)

  useEffect(() => {
    if (!id || !data?.data || sseConnected.current) return

    const status = data.data.status
    if (status === 'COMPLETED' || status === 'FAILED') {
      return
    }

    sseConnected.current = true
    const eventSource = new EventSource(`/api/meetings/${id}/events`)

    eventSource.addEventListener('status', (event) => {
      try {
        const payload = JSON.parse(event.data)
        queryClient.invalidateQueries({ queryKey: meetingKeys.detail(id) })

        if (payload.status === 'COMPLETED' || payload.status === 'FAILED') {
          eventSource.close()
        }
      } catch (err) {
        console.error('Error parsing SSE payload', err)
      }
    })

    eventSource.onerror = (err) => {
      console.error('SSE connection error', err)
    }

    return () => {
      eventSource.close()
      sseConnected.current = false
    }
  }, [id, data?.data, queryClient])

  if (isLoading) {
    return <PageSkeleton />
  }

  if (error || !data?.data) {
    return (
      <GlassCard className="border-rose-500/30 bg-rose-500/5">
        <h2 className="text-xl font-bold text-rose-400 mb-2">Failed to load meeting</h2>
        <p className="text-sm text-slate-400">{error?.message || 'Meeting not found'}</p>
        <Link to="/meetings" className="mt-4 inline-block">
          <Button variant="secondary">Back to Meetings</Button>
        </Link>
      </GlassCard>
    )
  }

  const meeting = data.data
  const currentStageOrder = PIPELINE_STAGES.find(s => s.id === meeting.status)?.order ?? -1
  const isFailed = meeting.status === 'FAILED'

  const handleCopyDraft = () => {
    if (meeting.emailDraft?.body) {
      navigator.clipboard.writeText(meeting.emailDraft.body)
      setCopiedDraft(true)
      setTimeout(() => setCopiedDraft(false), 2500)
    }
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-300">
      {/* Top Breadcrumb & Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Link to="/meetings" className="hover:text-cyan-400 transition-colors">
              Meetings
            </Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-cyan-400 font-medium truncate max-w-[200px]">
              {meeting.title}
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            {meeting.title}
          </h1>

          <div className="flex items-center gap-3 text-xs text-slate-400">
            <span className="flex items-center gap-1 font-mono">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              Analyzed {new Date(meeting.createdAt).toLocaleString()}
            </span>
            <span className="text-white/20">•</span>
            <StatusBadge status={meeting.status} />
          </div>
        </div>

        <Button
          variant="danger"
          size="sm"
          icon={Trash2}
          onClick={() => setShowDeleteModal(true)}
        >
          Delete Meeting
        </Button>
      </div>

      {/* Multi-Agent Pipeline Status Stepper */}
      <GlassCard padding="md" className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
              <Activity className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Multi-Agent Orchestration Flow
              </h3>
              <p className="text-xs text-slate-400">
                Deterministic 4-Agent Pipeline: Grok / xAI LLM Orchestration
              </p>
            </div>
          </div>
          <Badge variant={meeting.status === 'COMPLETED' ? 'emerald' : isFailed ? 'red' : 'amber'} size="sm">
            {meeting.status}
          </Badge>
        </div>

        {isFailed ? (
          <div className="flex items-center gap-3 text-rose-300 font-medium bg-rose-500/10 p-4 rounded-xl border border-rose-500/30">
            <AlertCircle className="w-5 h-5 text-rose-400 flex-shrink-0" />
            <span>Analysis failed during agent processing. Check your LLM API limits or try again.</span>
          </div>
        ) : (
          <div className="pt-4 pb-2 relative">
            {/* Connecting Line */}
            <div className="hidden sm:block absolute left-8 right-8 top-10 h-0.5 bg-white/10 z-0" />

            <div className="grid grid-cols-2 sm:grid-cols-6 gap-4 relative z-10">
              {PIPELINE_STAGES.map((stage) => {
                const isPast = stage.order < currentStageOrder
                const isCurrent = stage.order === currentStageOrder
                const isCompleted = meeting.status === 'COMPLETED'

                return (
                  <div key={stage.id} className="flex flex-col items-center text-center gap-2">
                    <div
                      className={`
                        w-11 h-11 rounded-2xl flex items-center justify-center transition-all duration-300
                        ${
                          (isPast || isCompleted)
                            ? 'bg-gradient-to-tr from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/25 border border-cyan-400/40'
                            : isCurrent
                            ? 'bg-[#081220] text-cyan-300 border-2 border-cyan-400 ring-4 ring-cyan-500/20 shadow-lg shadow-cyan-500/30 animate-pulse'
                            : 'bg-[#081220]/70 text-slate-500 border border-white/10'
                        }
                      `}
                    >
                      {(isPast || isCompleted) ? (
                        <CheckCircle2 className="w-5 h-5 text-white" />
                      ) : isCurrent ? (
                        <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
                      ) : (
                        <Circle className="w-5 h-5 text-slate-600" />
                      )}
                    </div>
                    <span
                      className={`text-xs font-semibold max-w-[100px] ${
                        isCurrent
                          ? 'text-cyan-300'
                          : (isPast || isCompleted)
                          ? 'text-white'
                          : 'text-slate-500'
                      }`}
                    >
                      {stage.label}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </GlassCard>

      {/* Main 2-Column Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column (2 Cols): Executive Summary & Action Items */}
        <div className="lg:col-span-2 space-y-8">
          {/* Executive Summary Card */}
          {meeting.summary ? (
            <GlassCard padding="none" className="overflow-hidden">
              <div className="px-6 py-4.5 border-b border-white/[0.08] bg-white/[0.02] flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                    <FileText className="w-4 h-4" />
                  </div>
                  <h2 className="text-base font-bold text-white">Executive Summary</h2>
                </div>
                <span className="text-xs text-slate-400 font-mono">Agent #1 Output</span>
              </div>

              <div className="p-6 space-y-6">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                    Meeting Overview
                  </h3>
                  <p className="text-slate-200 leading-relaxed text-sm sm:text-base">
                    {meeting.summary.overview}
                  </p>
                </div>

                {meeting.summary.keyDecisions && meeting.summary.keyDecisions.length > 0 && (
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                      Key Decisions Finalized
                    </h3>
                    <ul className="space-y-2.5">
                      {meeting.summary.keyDecisions.map((decision, i) => (
                        <li
                          key={i}
                          className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/[0.05]"
                        >
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                          <span className="text-sm text-slate-200 leading-normal">{decision}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {meeting.summary.discussionTopics && meeting.summary.discussionTopics.length > 0 && (
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                      Core Discussion Topics
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {meeting.summary.discussionTopics.map((topic, i) => (
                        <span
                          key={i}
                          className="px-3 py-1.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-xs font-medium"
                        >
                          {topic}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </GlassCard>
          ) : (
            <GlassCard padding="lg" className="text-center text-slate-400 text-sm">
              <Bot className="w-8 h-8 text-cyan-400 mx-auto mb-2 animate-pulse" />
              <p>Summarizer Agent is synthesizing executive takeaways...</p>
            </GlassCard>
          )}

          {/* Action Items Card */}
          {meeting.actionItems && meeting.actionItems.length > 0 && (
            <GlassCard padding="none" className="overflow-hidden">
              <div className="px-6 py-4.5 border-b border-white/[0.08] bg-white/[0.02] flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                    <ListTodo className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-white">Extracted Action Items</h2>
                  </div>
                </div>
                <span className="text-xs text-slate-400 font-mono">
                  {meeting.actionItems.length} Deliverables
                </span>
              </div>

              <div className="divide-y divide-white/[0.06]">
                {meeting.actionItems.map((item) => (
                  <div
                    key={item.id}
                    className="p-5 sm:p-6 hover:bg-white/[0.02] transition-colors"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                      <div className="flex-1 space-y-1.5">
                        <p className="font-semibold text-white text-sm sm:text-base">
                          {item.description}
                        </p>
                        {item.context && (
                          <p className="text-xs text-slate-400 leading-relaxed">
                            {item.context}
                          </p>
                        )}
                      </div>

                      <div className="flex flex-col items-start sm:items-end gap-2 flex-shrink-0">
                        {item.assignee && (
                          <span className="px-2.5 py-1 rounded-lg bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 text-xs font-semibold">
                            {item.assignee}
                          </span>
                        )}
                        {item.dueDate && (
                          <span className="inline-flex items-center gap-1 text-xs text-slate-300 bg-white/[0.05] border border-white/10 px-2.5 py-1 rounded-lg font-mono">
                            <Clock className="w-3 h-3 text-cyan-400" />
                            {item.dueDate}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </GlassCard>
          )}

          {/* Collapsible Raw Transcript */}
          <GlassCard padding="none" className="overflow-hidden">
            <button
              onClick={() => setShowTranscript(!showTranscript)}
              className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-white/[0.02] transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <Code2 className="w-4 h-4 text-slate-400" />
                <span className="text-sm font-semibold text-slate-300">
                  Raw Transcript Source ({meeting.transcript ? `${meeting.transcript.length} characters` : 'Empty'})
                </span>
              </div>
              {showTranscript ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
            </button>

            {showTranscript && (
              <div className="p-6 border-t border-white/[0.08] bg-[#070e19]">
                <pre className="text-xs text-slate-300 font-mono whitespace-pre-wrap leading-relaxed max-h-96 overflow-y-auto custom-scrollbar">
                  {meeting.transcript}
                </pre>
              </div>
            )}
          </GlassCard>
        </div>

        {/* Right Column (1 Col): Follow-up Email Draft & Review Findings */}
        <div className="space-y-8">
          {/* Email Draft Card */}
          {meeting.emailDraft && (
            <GlassCard padding="none" className="overflow-hidden">
              <div className="px-6 py-4.5 border-b border-white/[0.08] bg-white/[0.02] flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <h2 className="text-base font-bold text-white">Follow-up Email</h2>
                </div>

                <Button
                  variant="secondary"
                  size="sm"
                  icon={copiedDraft ? Check : Copy}
                  onClick={handleCopyDraft}
                >
                  {copiedDraft ? 'Copied' : 'Copy'}
                </Button>
              </div>

              <div className="p-6 space-y-4">
                <div className="space-y-2 text-xs">
                  <div className="flex items-start gap-2">
                    <span className="font-bold text-slate-400 w-16 flex-shrink-0">Subject:</span>
                    <span className="text-slate-200 font-medium">{meeting.emailDraft.subject}</span>
                  </div>
                  {meeting.emailDraft.recipientSuggestions && meeting.emailDraft.recipientSuggestions.length > 0 && (
                    <div className="flex items-start gap-2">
                      <span className="font-bold text-slate-400 w-16 flex-shrink-0">To:</span>
                      <div className="flex flex-wrap gap-1">
                        {meeting.emailDraft.recipientSuggestions.map((rec, i) => (
                          <span
                            key={i}
                            className="px-2 py-0.5 rounded bg-white/[0.06] text-slate-200 font-mono"
                          >
                            {rec}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-4 p-4 rounded-xl bg-[#081220] border border-white/10 text-xs sm:text-sm text-slate-200 leading-relaxed font-sans prose prose-invert max-w-none">
                  <ReactMarkdown>{meeting.emailDraft.body}</ReactMarkdown>
                </div>
              </div>
            </GlassCard>
          )}

          {/* AI Reviewer Audit Card */}
          {meeting.review && (
            <GlassCard padding="none" className="overflow-hidden">
              <div
                className={`px-6 py-4 border-b flex items-center justify-between ${
                  meeting.review.verified
                    ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-300'
                    : 'border-amber-500/20 bg-amber-500/10 text-amber-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-current" />
                  <h2 className="text-sm font-bold uppercase tracking-wider">
                    Agent #4 Verification Audit
                  </h2>
                </div>
                <Badge variant={meeting.review.verified ? 'emerald' : 'amber'} size="sm">
                  {meeting.review.verified ? 'Grounded & Verified' : 'Discrepancies Noted'}
                </Badge>
              </div>

              <div className="p-6 space-y-4 text-xs">
                {!meeting.review.verified && (
                  <p className="text-amber-300 font-medium">
                    The Reviewer agent detected potential inconsistencies between the transcript and generated drafts.
                  </p>
                )}

                {meeting.review.hallucinatedItems && meeting.review.hallucinatedItems.length > 0 && (
                  <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/25 space-y-1.5">
                    <h3 className="font-bold text-rose-300 flex items-center gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5" />
                      Unsupported Claims
                    </h3>
                    <ul className="list-disc list-inside text-rose-200 space-y-1">
                      {meeting.review.hallucinatedItems.map((item, i) => (
                        <li key={i}>{item}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {meeting.review.missedItems && meeting.review.missedItems.length > 0 && (
                  <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/25 space-y-1.5">
                    <h3 className="font-bold text-amber-300 flex items-center gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5" />
                      Missed Action Items
                    </h3>
                    <ul className="list-disc list-inside text-amber-200 space-y-1">
                      {meeting.review.missedItems.map((item, i) => (
                        <li key={i}>{item}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {meeting.review.dateOrAssigneeDiscrepancies && meeting.review.dateOrAssigneeDiscrepancies.length > 0 && (
                  <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/25 space-y-1.5">
                    <h3 className="font-bold text-amber-300 flex items-center gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5" />
                      Date / Assignee Discrepancies
                    </h3>
                    <ul className="list-disc list-inside text-amber-200 space-y-1">
                      {meeting.review.dateOrAssigneeDiscrepancies.map((item, i) => (
                        <li key={i}>{item}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="pt-3 border-t border-white/[0.08] space-y-1">
                  <h3 className="font-bold text-white uppercase tracking-wider text-[11px]">
                    Reviewer Commentary
                  </h3>
                  <p className="text-slate-300 leading-relaxed">
                    {meeting.review.commentary}
                  </p>
                </div>
              </div>
            </GlassCard>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Permanently delete meeting?"
        description="This action cannot be undone."
      >
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300 space-y-2">
            <p className="font-bold">
              Permanently deleting "{meeting.title}" will erase:
            </p>
            <ul className="list-disc list-inside space-y-1 ml-1 text-slate-300">
              <li>Executive summary & decisions</li>
              <li>All extracted action items</li>
              <li>Follow-up draft email</li>
              <li>AI review audit verification</li>
              <li>RAG embeddings from PostgreSQL pgvector</li>
            </ul>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button
              variant="secondary"
              onClick={() => setShowDeleteModal(false)}
              disabled={deleteMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              icon={Trash2}
              loading={deleteMutation.isPending}
              onClick={() => {
                if (!id) return
                deleteMutation.mutate(id, {
                  onSuccess: () => {
                    setShowDeleteModal(false)
                    navigate('/meetings')
                  }
                })
              }}
            >
              Confirm Delete
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
