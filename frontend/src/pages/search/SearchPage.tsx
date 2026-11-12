import React, { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import {
  Search,
  Sparkles,
  Database,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  AlertCircle,
  Bot,
  Layers
} from 'lucide-react'
import { ragApi } from '../../api/ragApi'
import type { MeetingCitation, RagResponse } from '../../types/rag'
import { GlassCard } from '../../components/common/GlassCard'
import { Badge } from '../../components/common/Badge'
import { Button } from '../../components/common/Button'
import ReactMarkdown from 'react-markdown'

export function SearchPage() {
  const [searchParams] = useSearchParams()
  const initialQuery = searchParams.get('q') || ''

  const [mode, setMode] = useState<'ask' | 'search'>('ask')
  const [query, setQuery] = useState(initialQuery)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [ragResult, setRagResult] = useState<RagResponse | null>(null)
  const [searchResults, setSearchResults] = useState<MeetingCitation[]>([])
  const [expandedCitation, setExpandedCitation] = useState<number | null>(null)

  const [indexing, setIndexing] = useState(false)
  const [indexMessage, setIndexMessage] = useState<string | null>(null)

  const suggestedQueries = [
    'What decisions were made regarding authentication & database architecture?',
    'What tasks were assigned to Alex or Jordan?',
    'What was discussed about project timeline and Phase 2?',
    'What were the key takeaways from recent roadmap meetings?'
  ]

  const handleSearch = async (e?: React.FormEvent, customQuery?: string) => {
    if (e) e.preventDefault()
    const q = customQuery !== undefined ? customQuery : query
    if (!q.trim()) return

    setLoading(true)
    setError(null)

    try {
      if (mode === 'ask') {
        const response = await ragApi.query({ query: q, topK: 4, minSimilarity: 0.15 })
        setRagResult(response)
        setSearchResults([])
      } else {
        const citations = await ragApi.search({ query: q, topK: 6, minSimilarity: 0.15 })
        setSearchResults(citations)
        setRagResult(null)
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Failed to retrieve information from RAG vector store')
    } finally {
      setLoading(false)
    }
  }

  const handleIndexAll = async () => {
    setIndexing(true)
    setIndexMessage(null)
    try {
      const res = await ragApi.indexAll()
      setIndexMessage(res.message || `Indexed ${res.indexedMeetings} meetings successfully!`)
      setTimeout(() => setIndexMessage(null), 5000)
    } catch (err: any) {
      setIndexMessage(`Indexing failed: ${err?.message || 'Unknown error'}`)
    } finally {
      setIndexing(false)
    }
  }

  const citationsToDisplay = mode === 'ask' && ragResult ? ragResult.citations : searchResults

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-300">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 shadow-md">
              <Sparkles className="w-5 h-5" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Historical Meeting Intelligence
            </h1>
          </div>
          <p className="text-sm text-slate-400 mt-1 max-w-2xl">
            Query across all historical meetings using PostgreSQL pgvector semantic retrieval and grounded AI synthesis.
          </p>
        </div>

        <Button
          variant="secondary"
          size="sm"
          icon={Database}
          loading={indexing}
          onClick={handleIndexAll}
        >
          {indexing ? 'Embedding...' : 'Index All Chunks'}
        </Button>
      </div>

      {indexMessage && (
        <div className="p-4 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs flex items-center gap-3">
          <CheckCircle2 className="w-4 h-4 text-cyan-400 flex-shrink-0" />
          <span>{indexMessage}</span>
        </div>
      )}

      {/* Mode Switcher and Search Console */}
      <GlassCard padding="lg" className="space-y-6">
        {/* Mode Toggle */}
        <div className="flex items-center gap-2 p-1 rounded-xl bg-[#081220] border border-white/10 w-fit">
          <button
            type="button"
            onClick={() => {
              setMode('ask')
              setSearchResults([])
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
              mode === 'ask'
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md shadow-cyan-950/40'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Ask AI (Grounded Synthesis)</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setMode('search')
              setRagResult(null)
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
              mode === 'search'
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md shadow-cyan-950/40'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Search className="w-3.5 h-3.5" />
            <span>Semantic Search (Direct Chunks)</span>
          </button>
        </div>

        {/* Input Form */}
        <form onSubmit={(e) => handleSearch(e)} className="relative flex items-center">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
            <Search className="w-5 h-5 text-cyan-400" />
          </div>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={
              mode === 'ask'
                ? 'Ask any question across your meetings (e.g. What were our decisions on Kafka and Redis?)...'
                : 'Search raw historical transcript chunks by concept...'
            }
            className="w-full h-14 pl-12 pr-32 rounded-2xl bg-[#081220]/80 border border-white/10 text-sm sm:text-base text-white placeholder-slate-400 focus:outline-none focus:border-cyan-500/60 focus:ring-2 focus:ring-cyan-500/20 transition-all shadow-inner"
          />
          <div className="absolute inset-y-0 right-2 flex items-center">
            <Button
              type="submit"
              variant="primary"
              size="md"
              loading={loading}
              disabled={!query.trim()}
            >
              {mode === 'ask' ? 'Synthesize' : 'Search'}
            </Button>
          </div>
        </form>

        {/* Query Suggestions */}
        <div className="space-y-2 pt-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Suggested Cross-Meeting Prompts
          </span>
          <div className="flex flex-wrap gap-2">
            {suggestedQueries.map((suggested, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setQuery(suggested)
                  handleSearch(undefined, suggested)
                }}
                className="text-left px-3 py-1.5 rounded-xl bg-white/[0.03] hover:bg-cyan-500/10 border border-white/10 hover:border-cyan-500/30 text-xs text-slate-300 hover:text-cyan-300 transition-all"
              >
                "{suggested}"
              </button>
            ))}
          </div>
        </div>
      </GlassCard>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-rose-400 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Synthesis Answer Result */}
      {mode === 'ask' && ragResult && (
        <GlassCard padding="lg" className="space-y-6 border-cyan-500/30 shadow-2xl">
          <div className="flex items-center justify-between pb-4 border-b border-white/[0.08]">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-white text-base">Grounded AI Synthesis</h3>
                <p className="text-xs text-slate-400">Answer derived strictly from meeting transcripts</p>
              </div>
            </div>
            <Badge variant="cyan" size="sm">Grounded</Badge>
          </div>

          <div className="prose prose-invert max-w-none text-slate-200 leading-relaxed text-sm sm:text-base">
            <ReactMarkdown>{ragResult.answer}</ReactMarkdown>
          </div>
        </GlassCard>
      )}

      {/* Citations / Excerpts Section */}
      {citationsToDisplay.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-white text-base flex items-center gap-2">
              <Layers className="w-4 h-4 text-cyan-400" />
              <span>Grounded Citations & Transcript Excerpts ({citationsToDisplay.length})</span>
            </h3>
            <span className="text-xs text-slate-400">Ranked by Cosine Similarity</span>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {citationsToDisplay.map((citation, idx) => {
              const isExpanded = expandedCitation === idx
              const similarityPct = Math.round((citation.similarityScore || 0) * 100)

              return (
                <GlassCard
                  key={idx}
                  padding="md"
                  className="space-y-3 hover:border-cyan-500/30 transition-all"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-lg bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 flex items-center justify-center text-xs font-bold font-mono">
                        #{idx + 1}
                      </span>
                      <Link
                        to={citation.meetingId ? `/meetings/${citation.meetingId}` : '#'}
                        className="font-bold text-white hover:text-cyan-400 text-sm sm:text-base transition-colors flex items-center gap-1.5"
                      >
                        <span>{citation.meetingTitle || 'Meeting Reference'}</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </Link>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-slate-400">
                      {citation.similarityScore != null && (
                        <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 font-mono font-semibold">
                          {similarityPct}% match
                        </span>
                      )}
                      {citation.meetingDate && (
                        <span className="font-mono">{citation.meetingDate}</span>
                      )}
                    </div>
                  </div>

                  {/* Chunk text excerpt */}
                  <div className="p-4 rounded-xl bg-[#081220] border border-white/5 text-xs sm:text-sm text-slate-300 font-mono leading-relaxed">
                    {isExpanded ? citation.excerpt : `${(citation.excerpt || '').slice(0, 300)}...`}
                  </div>

                  <div className="flex justify-between items-center text-xs pt-1">
                    <button
                      onClick={() => setExpandedCitation(isExpanded ? null : idx)}
                      className="text-cyan-400 hover:text-cyan-300 font-medium flex items-center gap-1 cursor-pointer"
                    >
                      {isExpanded ? (
                        <>
                          <span>Show Less</span>
                          <ChevronUp className="w-3.5 h-3.5" />
                        </>
                      ) : (
                        <>
                          <span>Expand Full Excerpt</span>
                          <ChevronDown className="w-3.5 h-3.5" />
                        </>
                      )}
                    </button>

                    {citation.meetingId && (
                      <Link
                        to={`/meetings/${citation.meetingId}`}
                        className="text-slate-400 hover:text-white transition-colors"
                      >
                        Open Full Meeting Details →
                      </Link>
                    )}
                  </div>
                </GlassCard>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
