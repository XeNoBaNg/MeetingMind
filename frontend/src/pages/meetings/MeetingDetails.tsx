import { useEffect, useRef } from 'react'
import { useParams } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { useMeeting, meetingKeys } from '../../hooks/useMeetings'
import { CheckCircle2, Circle, AlertCircle, Copy, Mail, ListTodo, FileText, Activity } from 'lucide-react'
import ReactMarkdown from 'react-markdown'

const PIPELINE_STAGES = [
  { id: 'ANALYZING', label: 'Started', order: 0 },
  { id: 'SUMMARIZING', label: 'Summarizer Agent', order: 1 },
  { id: 'EXTRACTING', label: 'Extractor Agent', order: 2 },
  { id: 'DRAFTING', label: 'Drafter Agent', order: 3 },
  { id: 'REVIEWING', label: 'Reviewer Agent', order: 4 },
  { id: 'COMPLETED', label: 'Completed', order: 5 }
]

export function MeetingDetails() {
  const { id } = useParams<{ id: string }>()
  const { data, isLoading, error } = useMeeting(id!)
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
    return (
      <div className="p-8 max-w-5xl mx-auto space-y-8">
        <div className="h-10 w-64 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
        <div className="h-24 bg-slate-200 dark:bg-slate-800 rounded-xl animate-pulse" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="h-96 bg-slate-200 dark:bg-slate-800 rounded-xl animate-pulse" />
          </div>
        </div>
      </div>
    )
  }

  if (error || !data?.data) {
    return (
      <div className="p-8 text-red-600 dark:text-red-400">
        <h2 className="text-xl font-bold mb-2">Failed to load meeting</h2>
        <p>{error?.message || 'Meeting not found'}</p>
      </div>
    )
  }

  const meeting = data.data
  const currentStageOrder = PIPELINE_STAGES.find(s => s.id === meeting.status)?.order ?? -1
  const isFailed = meeting.status === 'FAILED'

  const handleCopyDraft = () => {
    if (meeting.emailDraft?.body) {
      navigator.clipboard.writeText(meeting.emailDraft.body)
    }
  }

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">{meeting.title}</h1>
        <div className="text-sm text-slate-500 dark:text-slate-400 mt-2">
          Analyzed on {new Date(meeting.createdAt).toLocaleString()}
        </div>
      </div>

      {/* Progress Stepper */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm mb-8">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white uppercase tracking-wider mb-6 flex items-center gap-2">
          <Activity className="w-4 h-4 text-blue-500" />
          Pipeline Status
        </h3>
        
        {isFailed ? (
          <div className="flex items-center gap-3 text-red-600 dark:text-red-400 font-medium bg-red-50 dark:bg-red-950/30 p-4 rounded-lg border border-red-200 dark:border-red-900/50">
            <AlertCircle className="w-5 h-5" />
            Analysis failed. Please try again.
          </div>
        ) : (
          <div className="flex items-center justify-between relative">
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-0.5 bg-slate-100 dark:bg-slate-800 z-0" />
            
            {PIPELINE_STAGES.map((stage) => {
              const isPast = stage.order < currentStageOrder
              const isCurrent = stage.order === currentStageOrder
              const isCompleted = meeting.status === 'COMPLETED'
              
              return (
                <div key={stage.id} className="relative z-10 flex flex-col items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center border-4 border-white dark:border-slate-900 ${
                    (isPast || isCompleted) ? 'bg-blue-600 text-white' : 
                    isCurrent ? 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-400 ring-2 ring-blue-500 ring-offset-2 dark:ring-offset-slate-900' : 
                    'bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500'
                  }`}>
                    {(isPast || isCompleted) ? <CheckCircle2 className="w-5 h-5" /> : 
                     isCurrent ? <div className="w-2.5 h-2.5 rounded-full bg-current animate-pulse" /> : 
                     <Circle className="w-5 h-5" />}
                  </div>
                  <span className={`text-xs font-medium max-w-[80px] text-center ${
                    isCurrent ? 'text-blue-700 dark:text-blue-400' :
                    (isPast || isCompleted) ? 'text-slate-700 dark:text-slate-300' :
                    'text-slate-400 dark:text-slate-500'
                  }`}>
                    {stage.label}
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <div className="xl:col-span-2 space-y-8">
          
          {/* Summary Section */}
          {meeting.summary && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
              <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-500" />
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">Executive Summary</h2>
              </div>
              <div className="p-6 space-y-6">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white uppercase tracking-wider mb-2">Overview</h3>
                  <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                    {meeting.summary.overview}
                  </p>
                </div>
                
                {meeting.summary.keyDecisions?.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-white uppercase tracking-wider mb-3">Key Decisions</h3>
                    <ul className="space-y-2">
                      {meeting.summary.keyDecisions.map((decision, i) => (
                        <li key={i} className="flex gap-3 text-slate-700 dark:text-slate-300">
                          <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                          <span>{decision}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {meeting.summary.discussionTopics?.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-white uppercase tracking-wider mb-3">Discussion Topics</h3>
                    <ul className="list-disc list-inside space-y-1 text-slate-700 dark:text-slate-300">
                      {meeting.summary.discussionTopics.map((topic, i) => (
                        <li key={i}>{topic}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Action Items */}
          {meeting.actionItems && meeting.actionItems.length > 0 && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
              <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 flex items-center gap-2">
                <ListTodo className="w-5 h-5 text-amber-500" />
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">Action Items</h2>
              </div>
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {meeting.actionItems.map((item) => (
                  <div key={item.id} className="p-4 sm:p-6 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                      <div className="flex-1">
                        <p className="font-medium text-slate-900 dark:text-white">{item.description}</p>
                        {item.context && (
                          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{item.context}</p>
                        )}
                      </div>
                      <div className="flex flex-col items-start sm:items-end gap-2 flex-shrink-0">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800">
                          {item.assignee}
                        </span>
                        {item.dueDate && (
                          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">
                            Due: {item.dueDate}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-8">
          
          {/* Email Draft */}
          {meeting.emailDraft && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
              <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Mail className="w-5 h-5 text-indigo-500" />
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white">Follow-up Draft</h2>
                </div>
                <button 
                  onClick={handleCopyDraft}
                  className="p-2 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 rounded-md transition-colors"
                  title="Copy to clipboard"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>
              <div className="p-6">
                <div className="mb-4 space-y-2">
                  <div className="text-sm">
                    <span className="font-semibold text-slate-900 dark:text-white">Subject: </span>
                    <span className="text-slate-700 dark:text-slate-300">{meeting.emailDraft.subject}</span>
                  </div>
                  {meeting.emailDraft.recipientSuggestions?.length > 0 && (
                    <div className="text-sm">
                      <span className="font-semibold text-slate-900 dark:text-white">To: </span>
                      <span className="text-slate-700 dark:text-slate-300">
                        {meeting.emailDraft.recipientSuggestions.join(', ')}
                      </span>
                    </div>
                  )}
                </div>
                <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-lg border border-slate-200 dark:border-slate-800 font-sans text-sm text-slate-700 dark:text-slate-300 prose prose-sm dark:prose-invert max-w-none">
                  <ReactMarkdown>{meeting.emailDraft.body}</ReactMarkdown>
                </div>
              </div>
            </div>
          )}

          {/* Review Findings */}
          {meeting.review && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
              <div className={`px-6 py-4 border-b flex items-center gap-2 ${
                meeting.review.verified 
                  ? 'border-emerald-200 bg-emerald-50 dark:bg-emerald-950/20 dark:border-emerald-900/50 text-emerald-900 dark:text-emerald-300'
                  : 'border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-900/50 text-amber-900 dark:text-amber-300'
              }`}>
                {meeting.review.verified ? <CheckCircle2 className="w-5 h-5 text-emerald-500" /> : <AlertCircle className="w-5 h-5 text-amber-500" />}
                <h2 className="text-lg font-bold">AI Review Audit</h2>
              </div>
              
              <div className="p-6 space-y-4 text-sm">
                {!meeting.review.verified && (
                  <p className="text-amber-700 dark:text-amber-400 font-medium mb-4">
                    The reviewer detected potential issues in the generated content.
                  </p>
                )}
                
                {meeting.review.hallucinatedItems?.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-slate-900 dark:text-white mb-2">Unsupported Claims</h3>
                    <ul className="list-disc list-inside text-red-600 dark:text-red-400 space-y-1">
                      {meeting.review.hallucinatedItems.map((item, i) => <li key={i}>{item}</li>)}
                    </ul>
                  </div>
                )}
                
                {meeting.review.missedItems?.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-slate-900 dark:text-white mb-2">Missed Action Items</h3>
                    <ul className="list-disc list-inside text-amber-600 dark:text-amber-400 space-y-1">
                      {meeting.review.missedItems.map((item, i) => <li key={i}>{item}</li>)}
                    </ul>
                  </div>
                )}

                {meeting.review.dateOrAssigneeDiscrepancies?.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-slate-900 dark:text-white mb-2">Discrepancies</h3>
                    <ul className="list-disc list-inside text-amber-600 dark:text-amber-400 space-y-1">
                      {meeting.review.dateOrAssigneeDiscrepancies.map((item, i) => <li key={i}>{item}</li>)}
                    </ul>
                  </div>
                )}

                <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
                  <h3 className="font-semibold text-slate-900 dark:text-white mb-2">Reviewer Commentary</h3>
                  <p className="text-slate-700 dark:text-slate-300">{meeting.review.commentary}</p>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
