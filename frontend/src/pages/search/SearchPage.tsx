import React, { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import {
  Search,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  HelpCircle,
  RefreshCw
} from 'lucide-react'
import { ragApi } from '../../api/ragApi'
import type { MeetingCitation, RagResponse } from '../../types/rag'
import { GlassCard } from '../../components/common/GlassCard'
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
    'What decisions were made regarding authentication and security?',
    'What tasks were assigned to Alex or Jordan?',
    'What was discussed about project timeline and deliverables?',
    'What were the key takeaways from recent review meetings?'
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
      setError(err?.response?.data?.message || err?.message || 'Failed to retrieve information from search index')
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
    <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in duration-200">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#172B3A] tracking-tight">
            Meeting Search
          </h1>
          <p className="text-xs sm:text-sm text-[#5A6E7F] mt-1 max-w-2xl">
            Search and ask questions across all your meeting transcripts, decisions, and deliverables.
          </p>
        </div>

        <Button
          variant="secondary"
          size="sm"
          icon={RefreshCw}
          loading={indexing}
          onClick={handleIndexAll}
        >
          Sync Search Index
        </Button>
      </div>

      {indexMessage && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between">
          <span>{indexMessage}</span>
          <button onClick={() => setIndexMessage(null)} className="text-emerald-700 hover:text-emerald-900 cursor-pointer font-bold">
            ✕
          </button>
        </div>
      )}

      {/* Search Input Box */}
      <GlassCard padding="lg">
        <form onSubmit={handleSearch} className="space-y-4">
          {/* Mode Switcher */}
          <div className="flex items-center gap-2 p-1 bg-[#EAF1F6]/70 rounded-xl border border-[#648296]/14 shadow-[inset_0_1px_2px_rgba(23,43,58,0.04)] w-fit">
            <button
              type="button"
              onClick={() => { setMode('ask'); setRagResult(null); setSearchResults([]); }}
              className={`
                px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer
                ${mode === 'ask' ? 'bg-white text-[#168AAD] shadow-[0_1px_2px_rgba(23,43,58,0.06),inset_0_1px_0_0_#ffffff]' : 'text-[#5A6E7F] hover:text-[#172B3A]'}
              `}
            >
              Ask About Meetings
            </button>
            <button
              type="button"
              onClick={() => { setMode('search'); setRagResult(null); setSearchResults([]); }}
              className={`
                px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer
                ${mode === 'search' ? 'bg-white text-[#168AAD] shadow-[0_1px_2px_rgba(23,43,58,0.06),inset_0_1px_0_0_#ffffff]' : 'text-[#5A6E7F] hover:text-[#172B3A]'}
              `}
            >
              Search Transcripts
            </button>
          </div>

          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#718096]">
              <Search className="w-5 h-5" />
            </div>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={
                mode === 'ask'
                  ? 'Ask any question about your past meetings and decisions...'
                  : 'Search transcripts by keywords or phrases...'
              }
              className="w-full h-11 pl-11 pr-28 rounded-xl bg-white border border-[#648296]/24 text-sm text-[#172B3A] placeholder-[#718096] focus:outline-none focus:border-[#168AAD] focus:ring-2 focus:ring-[#168AAD]/15 shadow-[inset_0_1px_2px_rgba(23,43,58,0.03)] transition-all"
            />
            <div className="absolute inset-y-1.5 right-1.5 flex items-center">
              <Button
                type="submit"
                variant="primary"
                size="sm"
                loading={loading}
                disabled={!query.trim()}
              >
                Search
              </Button>
            </div>
          </div>

          {/* Suggested Queries */}
          <div className="space-y-1.5 pt-1">
            <span className="text-[11px] font-semibold text-[#718096] uppercase tracking-wider">
              Example Questions:
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
                  className="px-2.5 py-1 rounded-lg bg-white/80 hover:bg-white border border-[#648296]/16 text-xs text-[#5A6E7F] hover:text-[#172B3A] shadow-[0_1px_2px_rgba(23,43,58,0.02),inset_0_1px_0_0_rgba(255,255,255,0.9)] hover:shadow-xs transition-all cursor-pointer text-left"
                >
                  "{suggested}"
                </button>
              ))}
            </div>
          </div>
        </form>
      </GlassCard>

      {error && (
        <GlassCard className="border-rose-300 bg-rose-50/60 text-rose-800">
          <div className="flex items-center gap-2 mb-1">
            <AlertCircle className="w-4 h-4 text-rose-600" />
            <h3 className="text-sm font-bold">Search query failed</h3>
          </div>
          <p className="text-xs text-rose-700">{error}</p>
        </GlassCard>
      )}

      {/* Answer View */}
      {mode === 'ask' && ragResult && (
        <GlassCard padding="lg" className="space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-[#648296]/14">
            <HelpCircle className="w-4 h-4 text-[#168AAD]" />
            <h2 className="text-base font-bold text-[#172B3A]">Answer</h2>
          </div>

          <div className="prose prose-slate max-w-none text-xs sm:text-sm text-[#172B3A] leading-relaxed">
            <ReactMarkdown>{ragResult.answer}</ReactMarkdown>
          </div>
        </GlassCard>
      )}

      {/* Sources & Citations */}
      {citationsToDisplay && citationsToDisplay.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-bold uppercase tracking-wider text-[#718096]">
              Referenced Discussions ({citationsToDisplay.length})
            </span>
          </div>

          <div className="space-y-2.5">
            {citationsToDisplay.map((citation, idx) => {
              const isExpanded = expandedCitation === idx
              return (
                <GlassCard key={idx} padding="none" className="overflow-hidden">
                  <div
                    onClick={() => setExpandedCitation(isExpanded ? null : idx)}
                    className="p-4 flex items-center justify-between gap-4 hover:bg-slate-50/70 transition-colors cursor-pointer select-none"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="w-6 h-6 rounded-lg bg-[#EAF1F6] text-[#168AAD] font-bold text-xs flex items-center justify-center flex-shrink-0">
                        {idx + 1}
                      </span>
                      <div className="min-w-0">
                        <h4 className="text-sm font-semibold text-[#172B3A] truncate">
                          {citation.meetingTitle || 'Meeting Transcript'}
                        </h4>
                        <p className="text-xs text-[#718096] truncate">
                          Relevant discussion excerpt
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 flex-shrink-0">
                      {citation.meetingId && (
                        <Link
                          to={`/meetings/${citation.meetingId}`}
                          onClick={(e) => e.stopPropagation()}
                          className="text-xs text-[#168AAD] hover:underline flex items-center gap-1"
                        >
                          <span>Open meeting</span>
                          <ExternalLink className="w-3 h-3" />
                        </Link>
                      )}
                      {isExpanded ? <ChevronUp className="w-4 h-4 text-[#718096]" /> : <ChevronDown className="w-4 h-4 text-[#718096]" />}
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="p-4 border-t border-[#648296]/14 bg-[#F4F7FA] text-xs text-[#172B3A] leading-relaxed font-sans">
                      <p className="whitespace-pre-wrap">{citation.excerpt}</p>
                    </div>
                  )}
                </GlassCard>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
