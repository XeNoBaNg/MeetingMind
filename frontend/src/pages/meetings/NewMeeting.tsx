import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCreateMeeting } from '../../hooks/useMeetings'
import {
  FileText,
  ListTodo,
  Mail,
  ShieldCheck,
  Send,
  AlertCircle
} from 'lucide-react'
import { GlassCard } from '../../components/common/GlassCard'
import { Input, Textarea } from '../../components/common/Input'
import { Button } from '../../components/common/Button'

const SAMPLE_TRANSCRIPTS = [
  {
    label: 'Roadmap & Architecture',
    title: 'Q3 Product Architecture & Security Review',
    text: `Alex: Thanks everyone for joining. Today we need to finalize the auth migration and PostgreSQL search setup.
Jordan: On the authentication side, we've decided to switch to JWT with OAuth 2.0 PKCE support for external clients. I will complete the backend security filter chain by this Friday at 5:00 PM.
Sam: Regarding vector embeddings for semantic search, we will use local storage to keep the system local-first and zero cost.
Alex: Great decision. Sam, can you please complete the chunking and embedding service by next Tuesday at 3:00 PM?
Sam: Absolutely, I'm on it.
Jordan: Also, please make sure we document all tool definitions in the user guide before merging.
Alex: Agreed. Let's reconvene on Wednesday for verification.`
  },
  {
    label: 'Sprint Deliverables',
    title: 'Frontend Redesign & UX Optimization',
    text: `Elena: Good morning team. Today we are kicking off the premium dashboard redesign.
Marcus: The new design features a warm, light, clean aesthetic with soft translucent surfaces and comfortable spacing.
Elena: Marcus, please ensure all existing features, including Meeting Search, Action Items, and Integrations, are fully polished by Thursday at 6:00 PM.
Marcus: Will do. I'll also add loading skeletons and responsive layouts for every view.
David: What about the integration tests?
Elena: David, please verify the test suites and make sure all CI pipeline checks pass by Friday noon.
David: Understood, I'll run the full suite today.`
  }
]

export function NewMeeting() {
  const [title, setTitle] = useState('')
  const [transcript, setTranscript] = useState('')
  const navigate = useNavigate()
  const { mutate: createMeeting, isPending, error } = useCreateMeeting()

  const wordCount = transcript.trim() ? transcript.trim().split(/\s+/).length : 0

  const handleApplySample = (sample: typeof SAMPLE_TRANSCRIPTS[0]) => {
    setTitle(sample.title)
    setTranscript(sample.text)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !transcript.trim()) return

    createMeeting(
      { title, transcript },
      {
        onSuccess: (res) => {
          if (res.success && res.data) {
            navigate(`/meetings/${res.data.id}`)
          }
        },
      }
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-200">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#172B3A] tracking-tight">
          New Meeting
        </h1>
        <p className="text-xs sm:text-sm text-[#5A6E7F] mt-1 max-w-2xl">
          Submit your meeting transcript to automatically generate an executive summary, structured action items, a follow-up email draft, and quality review.
        </p>
      </div>

      {/* Deliverable Outputs Preview Banner */}
      <GlassCard padding="sm" className="bg-[#EAF1F6]/50">
        <div className="text-xs font-semibold text-[#5A6E7F] uppercase tracking-wider mb-2.5">
          Automated Outputs Generated
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
          <div className="flex items-center gap-2 p-2 rounded-lg bg-white border border-[#648296]/14">
            <FileText className="w-4 h-4 text-[#168AAD]" />
            <span className="font-medium text-[#172B3A]">Executive Summary</span>
          </div>

          <div className="flex items-center gap-2 p-2 rounded-lg bg-white border border-[#648296]/14">
            <ListTodo className="w-4 h-4 text-[#168AAD]" />
            <span className="font-medium text-[#172B3A]">Action Items</span>
          </div>

          <div className="flex items-center gap-2 p-2 rounded-lg bg-white border border-[#648296]/14">
            <Mail className="w-4 h-4 text-[#168AAD]" />
            <span className="font-medium text-[#172B3A]">Follow-up Email</span>
          </div>

          <div className="flex items-center gap-2 p-2 rounded-lg bg-white border border-[#648296]/14">
            <ShieldCheck className="w-4 h-4 text-[#168AAD]" />
            <span className="font-medium text-[#172B3A]">Quality Review</span>
          </div>
        </div>
      </GlassCard>

      {/* Quick Sample Selector */}
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className="text-[#718096] font-medium">Quick samples:</span>
        {SAMPLE_TRANSCRIPTS.map((sample, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => handleApplySample(sample)}
            className="px-2.5 py-1 rounded-lg bg-white border border-[#648296]/20 text-[#172B3A] hover:border-[#168AAD] hover:text-[#168AAD] transition-colors cursor-pointer"
          >
            {sample.label}
          </button>
        ))}
      </div>

      {/* Main Submission Form */}
      <GlassCard padding="lg">
        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
              <span>{error.message || 'Failed to submit meeting'}</span>
            </div>
          )}

          <Input
            label="Meeting Title"
            id="meeting-title"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Q3 Cloud Architecture & Security Review"
          />

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="meeting-transcript" className="block text-xs font-semibold uppercase tracking-wider text-[#5A6E7F]">
                Meeting Transcript
              </label>
              <span className="text-xs text-[#718096]">
                {wordCount} words
              </span>
            </div>

            <Textarea
              id="meeting-transcript"
              required
              rows={12}
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              placeholder="Paste the dialogue transcript of your meeting here..."
              className="font-mono text-xs leading-relaxed"
            />
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-[#648296]/14">
            <span className="text-xs text-[#718096]">
              Processing typically takes 10 to 20 seconds.
            </span>

            <Button
              type="submit"
              variant="primary"
              size="md"
              icon={Send}
              loading={isPending}
              disabled={!title.trim() || !transcript.trim()}
            >
              Analyze Meeting
            </Button>
          </div>
        </form>
      </GlassCard>
    </div>
  )
}
