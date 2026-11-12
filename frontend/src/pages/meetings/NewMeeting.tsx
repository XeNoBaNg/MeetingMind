import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCreateMeeting } from '../../hooks/useMeetings'
import {
  Type,
  Sparkles,
  Bot,
  Send,
  Zap
} from 'lucide-react'
import { GlassCard } from '../../components/common/GlassCard'
import { Input, Textarea } from '../../components/common/Input'
import { Button } from '../../components/common/Button'

const SAMPLE_TRANSCRIPTS = [
  {
    label: 'Roadmap & Architecture',
    title: 'Q3 Cloud Architecture & Security Review',
    text: `Alex: Thanks everyone for joining. Today we need to finalize the auth migration and PostgreSQL vector search setup.
Jordan: On the authentication side, we've decided to switch to JWT with OAuth 2.0 PKCE support for MCP clients. I will complete the backend security filter chain by this Friday at 5:00 PM.
Sam: Regarding vector embeddings for Phase 7 RAG, we will use PostgreSQL pgvector instead of an external paid vector DB to keep the system local-first and zero cost.
Alex: Great decision. Sam, can you please complete the chunking and embedding service by next Tuesday at 3:00 PM?
Sam: Absolutely, I'm on it.
Jordan: Also, please make sure we document all MCP tool definitions in the architecture guide before merging.
Alex: Agreed. Let's reconvene on Wednesday for verification.`
  },
  {
    label: 'Sprint Deliverables',
    title: 'Frontend Redesign & Performance Optimization',
    text: `Elena: Good morning team. Today we are kicking off the premium admin dashboard redesign.
Marcus: The new design features a deep navy and cyan atmospheric theme with glassmorphic cards and responsive mobile drawers.
Elena: Marcus, please ensure all existing features, including RAG search, Action Items, and MCP connection pages, are fully integrated by Thursday at 6:00 PM.
Marcus: Will do. I'll also add loading skeletons and empty states for every view.
David: What about the Kafka consumer container tests?
Elena: David, please verify the testcontainer setups and make sure all CI pipeline checks pass by Friday noon.
David: Understood, I'll run the container integration tests today.`
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
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-300">
      {/* Page Header */}
      <div>
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 shadow-md">
            <Sparkles className="w-5 h-5" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Analyze New Meeting
          </h1>
        </div>
        <p className="text-sm text-slate-400 mt-1 max-w-2xl">
          Submit your raw meeting transcript to trigger the multi-agent AI pipeline.
          Our 4 specialized agents will summarize, extract action items, draft an email, and audit for accuracy.
        </p>
      </div>

      {/* 4-Agent Pipeline Workflow Card */}
      <GlassCard padding="sm" className="bg-[#0b1b30]/60 border-cyan-500/20">
        <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
          <div className="flex items-center gap-2">
            <Bot className="w-4 h-4 text-cyan-400" />
            <span className="text-xs font-bold uppercase tracking-wider text-white">
              Automated Pipeline Workflow
            </span>
          </div>
          <span className="text-[11px] text-cyan-400 font-mono">Sequential AI</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 text-xs">
          <div className="flex items-center gap-2 p-2 rounded-lg bg-white/[0.02]">
            <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-300 flex items-center justify-center font-bold text-[10px]">
              1
            </span>
            <span className="text-slate-300 font-medium">Summarizer</span>
          </div>
          <div className="flex items-center gap-2 p-2 rounded-lg bg-white/[0.02]">
            <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-300 flex items-center justify-center font-bold text-[10px]">
              2
            </span>
            <span className="text-slate-300 font-medium">Extractor</span>
          </div>
          <div className="flex items-center gap-2 p-2 rounded-lg bg-white/[0.02]">
            <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-300 flex items-center justify-center font-bold text-[10px]">
              3
            </span>
            <span className="text-slate-300 font-medium">Drafter</span>
          </div>
          <div className="flex items-center gap-2 p-2 rounded-lg bg-white/[0.02]">
            <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-300 flex items-center justify-center font-bold text-[10px]">
              4
            </span>
            <span className="text-slate-300 font-medium">Reviewer</span>
          </div>
        </div>
      </GlassCard>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm">
          Failed to create meeting analysis: {error.message}
        </div>
      )}

      {/* Main Analysis Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <GlassCard padding="lg" className="space-y-6">
          {/* Quick Sample Selector */}
          <div className="space-y-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Quick Test Presets
            </span>
            <div className="flex flex-wrap gap-2">
              {SAMPLE_TRANSCRIPTS.map((sample, idx) => (
                <button
                  type="button"
                  key={idx}
                  onClick={() => handleApplySample(sample)}
                  className="px-3 py-1.5 rounded-xl bg-white/[0.04] hover:bg-cyan-500/15 border border-white/10 hover:border-cyan-500/30 text-xs text-slate-300 hover:text-cyan-300 transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Zap className="w-3 h-3 text-cyan-400" />
                  <span>{sample.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Meeting Title Input */}
          <Input
            label="Meeting Title"
            icon={Type}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Q3 Product Roadmap & Security Architecture Sync"
            required
          />

          {/* Meeting Transcript Textarea */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                Raw Meeting Transcript
              </label>
              <span className="text-xs text-slate-400 font-mono">
                {wordCount} words • {transcript.length} chars
              </span>
            </div>

            <Textarea
              rows={12}
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              placeholder="Paste your meeting conversation transcript here (speaker tags e.g. Alex:, Jordan: supported)..."
              required
              className="font-mono text-xs leading-relaxed"
            />
          </div>
        </GlassCard>

        {/* Submit Actions */}
        <div className="flex items-center justify-end gap-4">
          <Button
            type="button"
            variant="ghost"
            onClick={() => navigate('/meetings')}
          >
            Cancel
          </Button>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            icon={Send}
            loading={isPending}
            disabled={!title.trim() || !transcript.trim()}
          >
            {isPending ? 'Publishing to Kafka & Pipeline...' : 'Start AI Analysis'}
          </Button>
        </div>
      </form>
    </div>
  )
}
