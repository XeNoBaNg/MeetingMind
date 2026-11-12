import React, { useState } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import {
  Menu,
  Search,
  Plus,
  Zap
} from 'lucide-react'
import { useAuth } from '../../features/auth/AuthContext'

interface TopNavProps {
  onOpenMobile: () => void
}

export function TopNav({ onOpenMobile }: TopNavProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuth()

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`)
      setSearchQuery('')
    }
  }

  // Derive page title from pathname
  const getPageInfo = () => {
    const path = location.pathname
    if (path === '/') return { title: 'Overview Dashboard', category: 'Operations' }
    if (path === '/meetings') return { title: 'Meetings', category: 'Operations' }
    if (path === '/meetings/new') return { title: 'New Analysis', category: 'Meetings' }
    if (path.startsWith('/meetings/')) return { title: 'Meeting Details', category: 'Meetings' }
    if (path === '/action-items') return { title: 'Action Items', category: 'Tasks' }
    if (path === '/drafts') return { title: 'Email Drafts', category: 'Communications' }
    if (path === '/search') return { title: 'Historical Intelligence', category: 'Phase 7 RAG' }
    if (path === '/calendar') return { title: 'Calendar Schedule', category: 'Schedule' }
    if (path === '/mcp' || path === '/mcp-connect') return { title: 'MCP Integrations', category: 'Integration' }
    if (path === '/settings') return { title: 'Settings', category: 'Preferences' }
    return { title: 'Dashboard', category: 'MeetingMind' }
  }

  const { title, category } = getPageInfo()

  return (
    <header className="sticky top-0 z-20 h-20 bg-[#060d17]/80 backdrop-blur-xl border-b border-white/[0.08] px-4 sm:px-8 flex items-center justify-between gap-4">
      {/* Left: Mobile trigger & Page Title */}
      <div className="flex items-center gap-3 sm:gap-4">
        <button
          onClick={onOpenMobile}
          className="lg:hidden p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/[0.08] transition-colors"
          aria-label="Open mobile navigation"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold text-cyan-400 uppercase tracking-wider">
              {category}
            </span>
          </div>
          <h1 className="text-lg sm:text-xl font-extrabold text-white tracking-tight">
            {title}
          </h1>
        </div>
      </div>

      {/* Middle: Universal Search Bar */}
      <div className="hidden md:flex flex-1 max-w-md mx-4">
        <form onSubmit={handleSearchSubmit} className="relative w-full">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search transcripts, action items, or ask AI..."
            className="w-full h-10 pl-10 pr-12 rounded-xl bg-[#0b1728]/80 border border-white/[0.08] text-sm text-white placeholder-slate-400 focus:outline-none focus:border-cyan-500/60 focus:ring-2 focus:ring-cyan-500/20 transition-all"
          />
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-medium text-slate-400 bg-white/[0.06] border border-white/[0.1] rounded">
              ⌘K
            </kbd>
          </div>
        </form>
      </div>

      {/* Right: Actions & Profile */}
      <div className="flex items-center gap-3 sm:gap-4">
        {/* Real-time Status Badge */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-xs font-medium">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
          </span>
          <span className="hidden xl:inline">AI Pipeline Ready</span>
          <Zap className="w-3.5 h-3.5 text-cyan-400 ml-0.5" />
        </div>

        {/* Quick New Meeting Action */}
        <Link
          to="/meetings/new"
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md shadow-cyan-500/20 hover:from-cyan-400 hover:to-blue-500 transition-all active:scale-[0.98]"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">New Analysis</span>
        </Link>

        {/* User Pill */}
        <div className="flex items-center gap-2 pl-2 border-l border-white/[0.08]">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white font-bold text-xs shadow-md shadow-cyan-950/40">
            {user?.username?.substring(0, 2).toUpperCase() || 'MM'}
          </div>
        </div>
      </div>
    </header>
  )
}
