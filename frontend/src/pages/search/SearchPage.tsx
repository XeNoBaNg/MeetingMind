import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Search,
  Sparkles,
  Database,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Clock,
  Users,
  AlertCircle,
  CheckCircle2,
  RefreshCw
} from 'lucide-react'
import { ragApi } from '../../api/ragApi'
import type { MeetingCitation, RagResponse } from '../../types/rag'

export function SearchPage() {
  const [mode, setMode] = useState<'ask' | 'search'>('ask')
  const [query, setQuery] = useState('')
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
      setError(err?.response?.data?.message || err?.message || 'Failed to retrieve information')
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
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Historical Meeting Intelligence
            </h1>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
              <Sparkles className="w-3 h-3" /> Phase 7 RAG
            </span>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Perform cross-meeting semantic queries and synthesize factual answers grounded in historical transcripts.
          </p>
        </div>

        <button
          onClick={handleIndexAll}
          disabled={indexing}
          className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-medium rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition shadow-sm disabled:opacity-50"
          title="Scan and index all historical transcripts into PostgreSQL pgvector"
        >
          <Database className={`w-4 h-4 ${indexing ? 'animate-pulse text-indigo-500' : ''}`} />
          {indexing ? 'Indexing...' : 'Index All Meetings'}
        </button>
      </div>

      {indexMessage && (
        <div className="p-4 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 text-sm text-indigo-900 dark:text-indigo-200 flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-indigo-600 dark:text-indigo-400 flex-shrink-0" />
          <span>{indexMessage}</span>
        </div>
      )}

      {/* Mode Switcher & Search Bar */}
      <div className="space-y-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
          <button
            type="button"
            onClick={() => {
              setMode('ask')
              setSearchResults([])
            }}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg transition ${
              mode === 'ask'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            Ask AI (Grounded Synthesis)
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('search')
              setRagResult(null)
            }}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg transition ${
              mode === 'search'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Search className="w-4 h-4" />
            Semantic Search (Raw Excerpts)
          </button>
        </div>

        <form onSubmit={(e) => handleSearch(e)} className="relative flex items-center">
          <Search className="absolute left-4 w-5 h-5 text-slate-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={
              mode === 'ask'
                ? "Ask a question about past meetings (e.g. 'What was decided about auth?')..."
                : "Enter semantic search terms across historical transcripts..."
            }
            className="w-full pl-12 pr-28 py-3.5 text-slate-900 dark:text-slate-100 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition text-sm"
          />
          <button
            type="submit"
            disabled={loading || !query.trim()}
            className="absolute right-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
          >
            {loading ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : mode === 'ask' ? (
              <>
                <Sparkles className="w-4 h-4" /> Ask
              </>
            ) : (
              <>
                <Search className="w-4 h-4" /> Search
              </>
            )}
          </button>
        </form>

        {/* Suggested Queries */}
        <div className="pt-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
            Suggested Historical Queries:
          </p>
          <div className="flex flex-wrap gap-2">
            {suggestedQueries.map((suggested, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setQuery(suggested)
                  handleSearch(undefined, suggested)
                }}
                className="text-xs px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-950/40 text-slate-700 dark:text-slate-300 hover:text-blue-700 dark:hover:text-blue-300 transition border border-slate-200 dark:border-slate-700"
              >
                {suggested}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 flex items-start gap-3 text-red-700 dark:text-red-300 text-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Query Execution Error</p>
            <p className="text-xs mt-1">{error}</p>
          </div>
        </div>
      )}

      {/* Loading Skeleton */}
      {loading && (
        <div className="space-y-4">
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 animate-pulse space-y-3">
            <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-1/4"></div>
            <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-full"></div>
            <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-5/6"></div>
            <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-4/6"></div>
          </div>
        </div>
      )}

      {/* Ask AI Grounded Answer */}
      {!loading && ragResult && (
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-indigo-200/60 dark:border-indigo-900/50 shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 text-sm font-semibold">
            <Sparkles className="w-4 h-4" />
            <span>Grounded AI Answer</span>
          </div>

          <div className="prose dark:prose-invert max-w-none text-slate-800 dark:text-slate-200 text-sm leading-relaxed whitespace-pre-line">
            {ragResult.answer}
          </div>

          <div className="pt-2 text-xs text-slate-400 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <span>Retrieved from {ragResult.chunksRetrieved} transcript chunk(s)</span>
          </div>
        </div>
      )}

      {/* Citations / Search Results */}
      {!loading && citationsToDisplay && citationsToDisplay.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              {mode === 'ask' ? 'Source Meeting Citations' : `Matching Results (${citationsToDisplay.length})`}
            </h3>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {citationsToDisplay.map((citation, idx) => {
              const isExpanded = expandedCitation === idx
              const formattedScore = citation.similarityScore != null 
                ? `${Math.round(citation.similarityScore * 100)}% relevance` 
                : null

              return (
                <div
                  key={idx}
                  className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition shadow-sm space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <span className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 flex items-center justify-center text-xs font-bold">
                        {idx + 1}
                      </span>
                      <h4 className="font-semibold text-slate-900 dark:text-white text-base">
                        {citation.meetingTitle}
                      </h4>
                    </div>

                    <div className="flex items-center gap-2">
                      {formattedScore && (
                        <span className="px-2 py-0.5 rounded text-xs font-medium bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                          {formattedScore}
                        </span>
                      )}
                      {citation.meetingId && (
                        <Link
                          to={`/meetings/${citation.meetingId}`}
                          className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline ml-2"
                        >
                          View Meeting <ExternalLink className="w-3 h-3" />
                        </Link>
                      )}
                    </div>
                  </div>

                  {/* Metadata Tags */}
                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                    {citation.meetingDate && (
                      <div className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{citation.meetingDate}</span>
                      </div>
                    )}
                    {citation.speakers && citation.speakers.length > 0 && (
                      <div className="flex items-center gap-1">
                        <Users className="w-3.5 h-3.5" />
                        <span>{citation.speakers.join(', ')}</span>
                      </div>
                    )}
                  </div>

                  {/* Excerpt */}
                  <div className="bg-slate-50 dark:bg-slate-800/50 p-3.5 rounded-lg border border-slate-100 dark:border-slate-800 text-xs font-mono text-slate-700 dark:text-slate-300 leading-relaxed">
                    <div className={isExpanded ? '' : 'line-clamp-3'}>
                      {citation.excerpt}
                    </div>
                    {citation.excerpt.length > 200 && (
                      <button
                        type="button"
                        onClick={() => setExpandedCitation(isExpanded ? null : idx)}
                        className="mt-2 text-blue-600 dark:text-blue-400 font-sans font-semibold flex items-center gap-1 hover:underline"
                      >
                        {isExpanded ? (
                          <>
                            Show Less <ChevronUp className="w-3 h-3" />
                          </>
                        ) : (
                          <>
                            Show Full Excerpt <ChevronDown className="w-3 h-3" />
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Empty State when no query has been run */}
      {!loading && !ragResult && searchResults.length === 0 && (
        <div className="text-center py-16 px-4 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 text-slate-400 space-y-3">
          <Database className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600" />
          <p className="text-base font-medium text-slate-600 dark:text-slate-300">
            No Historical Search Results Yet
          </p>
          <p className="text-xs max-w-md mx-auto text-slate-400">
            Ask a natural question above or click one of the suggested query chips to retrieve decisions and dialogue turns from past meetings.
          </p>
        </div>
      )}
    </div>
  )
}
