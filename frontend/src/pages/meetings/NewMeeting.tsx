import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCreateMeeting } from '../../hooks/useMeetings'
import { FileText, Type } from 'lucide-react'

export function NewMeeting() {
  const [title, setTitle] = useState('')
  const [transcript, setTranscript] = useState('')
  const navigate = useNavigate()
  const { mutate: createMeeting, isPending, error } = useCreateMeeting()

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
    <div className="p-8 max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Analyze New Meeting</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">
          Paste your meeting transcript below and the AI pipeline will generate a summary, extract action items, and draft a follow-up email.
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 dark:bg-red-950/30 dark:border-red-800 dark:text-red-400 rounded-lg text-sm">
          Failed to create meeting: {error.message}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
          <div className="space-y-2">
            <label htmlFor="title" className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
              <Type className="w-4 h-4 text-slate-400" />
              Meeting Title
            </label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Q3 Roadmap Planning"
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-shadow"
              required
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="transcript" className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
              <FileText className="w-4 h-4 text-slate-400" />
              Raw Transcript
            </label>
            <textarea
              id="transcript"
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              placeholder="Paste your meeting transcript here..."
              rows={12}
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/50 font-mono text-sm resize-y transition-shadow"
              required
            />
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isPending || !title.trim() || !transcript.trim()}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-md font-medium shadow-sm transition-all flex items-center gap-2"
          >
            {isPending ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Submitting...
              </>
            ) : (
              'Analyze Meeting'
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
