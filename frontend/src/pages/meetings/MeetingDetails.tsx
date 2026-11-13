import { useEffect, useRef, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
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
  Trash2,
  Clock,
  ShieldCheck,
  ChevronRight,
  Check,
  ChevronDown,
  ChevronUp
} from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import { GlassCard } from '../../components/common/GlassCard'
import { Badge, StatusBadge } from '../../components/common/Badge'
import { Button } from '../../components/common/Button'
import { Modal } from '../../components/common/Modal'
import { PageSkeleton } from '../../components/common/LoadingSkeleton'

const WORKFLOW_STAGES = [
  { id: 'ANALYZING', label: 'Processing Started', order: 0 },
  { id: 'SUMMARIZING', label: 'Summary & Takeaways', order: 1 },
  { id: 'EXTRACTING', label: 'Action Items & Deliverables', order: 2 },
  { id: 'DRAFTING', label: 'Follow-up Email Draft', order: 3 },
  { id: 'REVIEWING', label: 'Verification & Review', order: 4 },
  { id: 'COMPLETED', label: 'Complete', order: 5 }
]

export function MeetingDetails() {
  const { id } = useParams<{ id: string }>()
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
      <GlassCard className="border-rose-300 bg-rose-50/60 text-rose-800">
        <h2 className="text-base font-bold mb-1">Failed to load meeting</h2>
        <p className="text-xs text-rose-700">{error?.message || 'Meeting not found'}</p>
        <Link to="/meetings" className="mt-4 inline-block">
          <Button variant="secondary" size="sm">Back to Meetings</Button>
        </Link>
      </GlassCard>
    )
  }

  const meeting = data.data
  const currentStageOrder = WORKFLOW_STAGES.find(s => s.id === meeting.status)?.order ?? -1
  const isFailed = meeting.status === 'FAILED'

  const handleCopyDraft = () => {
    if (meeting.emailDraft?.body) {
      navigator.clipboard.writeText(meeting.emailDraft.body)
      setCopiedDraft(true)
      setTimeout(() => setCopiedDraft(false), 2500)
    }
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-200">
      {/* Top Breadcrumb & Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-1.5 text-xs text-[#718096]">
            <Link to="/meetings" className="hover:text-[#168AAD] transition-colors">
              Meetings
            </Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-[#172B3A] font-medium truncate max-w-[240px]">
              {meeting.title}
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#172B3A] tracking-tight">
            {meeting.title}
          </h1>

          <div className="flex items-center gap-3 text-xs text-[#718096]">
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              Recorded {new Date(meeting.createdAt).toLocaleString(undefined, {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </span>
            <span>•</span>
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

      {/* Processing Status Stepper */}
      <GlassCard padding="md" className="space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#648296]/14">
          <div>
            <h3 className="text-sm font-bold text-[#172B3A]">
              Meeting Processing Status
            </h3>
            <p className="text-xs text-[#718096]">
              Automated intelligence workflow and verification
            </p>
          </div>
          <Badge variant={meeting.status === 'COMPLETED' ? 'emerald' : isFailed ? 'red' : 'amber'} size="sm">
            {meeting.status}
          </Badge>
        </div>

        {isFailed ? (
          <div className="flex items-center gap-3 text-rose-800 text-xs sm:text-sm bg-rose-50 p-4 rounded-xl border border-rose-200">
            <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
            <span>Analysis encountered an error during processing. You can try resubmitting the meeting transcript.</span>
          </div>
        ) : (
          <div className="pt-2 pb-2 relative">
            <div className="hidden sm:block absolute left-8 right-8 top-7 h-0.5 bg-slate-200 z-0" />

            <div className="grid grid-cols-2 sm:grid-cols-6 gap-3 relative z-10">
              {WORKFLOW_STAGES.map((stage) => {
                const isPast = stage.order < currentStageOrder
                const isCurrent = stage.order === currentStageOrder
                const isCompleted = meeting.status === 'COMPLETED'

                return (
                  <div key={stage.id} className="flex flex-col items-center text-center gap-2">
                    <div
                      className={`
                        w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200
                        ${
                          (isPast || isCompleted)
                            ? 'bg-[#168AAD] text-white shadow-2xs'
                            : isCurrent
                            ? 'bg-white text-[#168AAD] border-2 border-[#168AAD] ring-2 ring-[#168AAD]/20'
                            : 'bg-slate-100 text-[#718096] border border-[#648296]/20'
                        }
                      `}
                    >
                      {(isPast || isCompleted) ? (
                        <CheckCircle2 className="w-4 h-4 text-white" />
                      ) : isCurrent ? (
                        <div className="w-2 h-2 rounded-full bg-[#168AAD] animate-ping" />
                      ) : (
                        <Circle className="w-4 h-4 text-[#718096]" />
                      )}
                    </div>
                    <span
                      className={`text-[11px] font-medium max-w-[100px] leading-tight ${
                        isCurrent
                          ? 'text-[#168AAD] font-semibold'
                          : (isPast || isCompleted)
                          ? 'text-[#172B3A]'
                          : 'text-[#718096]'
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
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols): Executive Summary & Action Items */}
        <div className="lg:col-span-2 space-y-6">
          {/* Executive Summary Card */}
          {meeting.summary ? (
            <GlassCard padding="none" className="overflow-hidden">
              <div className="px-5 py-4 border-b border-[#648296]/14 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-[#168AAD]" />
                  <h2 className="text-base font-bold text-[#172B3A]">Executive Summary</h2>
                </div>
              </div>

              <div className="p-5 sm:p-6 space-y-5">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#718096] mb-1.5">
                    Meeting Overview
                  </h3>
                  <p className="text-xs sm:text-sm text-[#172B3A] leading-relaxed whitespace-pre-line">
                    {meeting.summary.overview}
                  </p>
                </div>

                {meeting.summary.keyDecisions && meeting.summary.keyDecisions.length > 0 && (
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[#718096] mb-2">
                      Key Decisions
                    </h3>
                    <ul className="space-y-2">
                      {meeting.summary.keyDecisions.map((decision: string, idx: number) => (
                        <li key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm text-[#172B3A]">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#168AAD] mt-2 flex-shrink-0" />
                          <span>{decision}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {meeting.summary.discussionTopics && meeting.summary.discussionTopics.length > 0 && (
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[#718096] mb-2">
                      Discussion Topics
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {meeting.summary.discussionTopics.map((point: string, idx: number) => (
                        <span
                          key={idx}
                          className="px-2.5 py-1 rounded-lg bg-[#EAF1F6] border border-[#648296]/16 text-xs text-[#172B3A]"
                        >
                          {point}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </GlassCard>
          ) : (
            <GlassCard className="py-8 text-center text-[#718096] text-xs">
              <p>Executive summary will appear once processing completes.</p>
            </GlassCard>
          )}

          {/* Action Items List */}
          <GlassCard padding="none" className="overflow-hidden">
            <div className="px-5 py-4 border-b border-[#648296]/14 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ListTodo className="w-4 h-4 text-[#168AAD]" />
                <h2 className="text-base font-bold text-[#172B3A]">Action Items & Deliverables</h2>
              </div>
              <span className="text-xs font-medium text-[#718096]">
                {meeting.actionItems?.length || 0} tasks
              </span>
            </div>

            <div className="p-5 sm:p-6">
              {!meeting.actionItems || meeting.actionItems.length === 0 ? (
                <p className="text-xs text-[#718096] text-center py-4">
                  No action items identified for this meeting.
                </p>
              ) : (
                <div className="space-y-3">
                  {meeting.actionItems.map((item: any) => (
                    <div
                      key={item.id}
                      className="p-3.5 rounded-xl bg-[#F4F7FA] border border-[#648296]/14 space-y-2"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <p className="text-xs sm:text-sm font-semibold text-[#172B3A]">
                          {item.description}
                        </p>
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${
                          item.status === 'DONE'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}>
                          {item.status}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-3 text-xs text-[#5A6E7F] pt-1 border-t border-[#648296]/10">
                        {item.assignee && (
                          <span>Assignee: <strong className="text-[#172B3A]">{item.assignee}</strong></span>
                        )}
                        {item.dueDate && (
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-[#718096]" />
                            Due: <strong className="text-[#172B3A]">{item.dueDate}</strong>
                          </span>
                        )}
                      </div>

                      {item.context && (
                        <p className="text-xs text-[#718096] italic bg-white/70 p-2 rounded-lg border border-[#648296]/10">
                          "{item.context}"
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </GlassCard>
        </div>

        {/* Right Column (1 Col): Follow-up Email & Review Analysis */}
        <div className="space-y-6">
          {/* Email Draft Card */}
          {meeting.emailDraft ? (
            <GlassCard padding="none" className="overflow-hidden">
              <div className="px-5 py-4 border-b border-[#648296]/14 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-[#168AAD]" />
                  <h3 className="font-bold text-[#172B3A] text-sm">Follow-up Email Draft</h3>
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

              <div className="p-5 space-y-4">
                {meeting.emailDraft.subject && (
                  <div>
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-[#718096] block mb-1">
                      Subject Line:
                    </span>
                    <p className="text-xs sm:text-sm font-semibold text-[#172B3A] bg-[#F4F7FA] p-2.5 rounded-lg border border-[#648296]/14">
                      {meeting.emailDraft.subject}
                    </p>
                  </div>
                )}

                <div>
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-[#718096] block mb-1">
                    Body:
                  </span>
                  <div className="prose prose-sm max-w-none bg-[#F4F7FA] p-3.5 rounded-lg border border-[#648296]/14 text-xs sm:text-sm text-[#172B3A] leading-relaxed">
                    <ReactMarkdown>{meeting.emailDraft.body}</ReactMarkdown>
                  </div>
                </div>
              </div>
            </GlassCard>
          ) : (
            <GlassCard className="py-6 text-center text-[#718096] text-xs">
              <p>Follow-up email draft will appear once generated.</p>
            </GlassCard>
          )}

          {/* Review & Quality Check Card */}
          {meeting.review && (
            <GlassCard padding="none" className="overflow-hidden">
              <div className="px-5 py-4 border-b border-[#648296]/14 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-[#168AAD]" />
                  <h3 className="font-bold text-[#172B3A] text-sm">Quality & Verification Review</h3>
                </div>
                <Badge
                  variant={meeting.review.verified ? 'emerald' : 'red'}
                  size="sm"
                >
                  {meeting.review.verified ? 'Verified' : 'Issues Detected'}
                </Badge>
              </div>

              <div className="p-5 space-y-3 text-xs">
                {!meeting.review.verified ? (
                  <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 space-y-1.5">
                    <p className="font-semibold">Verification check flagged potential items:</p>
                    {meeting.review.commentary && <p>{meeting.review.commentary}</p>}
                    {meeting.review.hallucinatedItems && meeting.review.hallucinatedItems.length > 0 && (
                      <div className="pt-1">
                        <span className="font-semibold">Unsubstantiated claims:</span>
                        <ul className="list-disc list-inside mt-0.5">
                          {meeting.review.hallucinatedItems.map((item, idx) => (
                            <li key={idx}>{item}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800">
                    <p className="font-semibold mb-1">Output verified against transcript:</p>
                    <p>{meeting.review.commentary || 'All key decisions and tasks are fully grounded in the transcript.'}</p>
                  </div>
                )}
              </div>
            </GlassCard>
          )}

          {/* Original Transcript Collapsible */}
          <GlassCard padding="none" className="overflow-hidden">
            <button
              onClick={() => setShowTranscript(!showTranscript)}
              className="w-full px-5 py-3.5 flex items-center justify-between text-left hover:bg-slate-50 transition-colors cursor-pointer"
            >
              <span className="text-xs font-bold text-[#172B3A]">View Original Transcript</span>
              {showTranscript ? <ChevronUp className="w-4 h-4 text-[#718096]" /> : <ChevronDown className="w-4 h-4 text-[#718096]" />}
            </button>

            {showTranscript && (
              <div className="p-5 border-t border-[#648296]/14 bg-[#F4F7FA]">
                <pre className="text-xs text-[#172B3A] whitespace-pre-wrap font-sans leading-relaxed max-h-96 overflow-y-auto custom-scrollbar">
                  {meeting.transcript}
                </pre>
              </div>
            )}
          </GlassCard>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete Meeting"
        maxWidth="sm"
      >
        <div className="space-y-4">
          <p className="text-xs sm:text-sm text-[#5A6E7F] leading-relaxed">
            Are you sure you want to permanently delete this meeting?
            This will remove all associated summary, action items, and draft records.
          </p>

          <div className="flex items-center justify-end gap-3 pt-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setShowDeleteModal(false)}
              disabled={deleteMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={() => {
                deleteMutation.mutate(meeting.id, {
                  onSuccess: () => {
                    window.location.href = '/meetings'
                  }
                })
              }}
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
