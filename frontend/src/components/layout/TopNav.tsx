import React, { useState } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import {
  Menu,
  Search,
  Plus
} from 'lucide-react'

interface TopNavProps {
  onOpenMobile: () => void
}

export function TopNav({ onOpenMobile }: TopNavProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const navigate = useNavigate()
  const location = useLocation()

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
    if (path === '/') return { title: 'Overview', category: 'Workspace' }
    if (path === '/meetings') return { title: 'Meetings', category: 'Workspace' }
    if (path === '/meetings/new') return { title: 'New Meeting', category: 'Meetings' }
    if (path.startsWith('/meetings/')) return { title: 'Meeting Details', category: 'Meetings' }
    if (path === '/action-items') return { title: 'Action Items', category: 'Tasks' }
    if (path === '/drafts') return { title: 'Email Drafts', category: 'Communications' }
    if (path === '/search') return { title: 'Meeting Search', category: 'Search' }
    if (path === '/calendar') return { title: 'Schedule Calendar', category: 'Calendar' }
    if (path === '/mcp' || path === '/mcp-connect') return { title: 'Integrations', category: 'Connected Tools' }
    if (path === '/settings') return { title: 'Settings', category: 'Preferences' }
    return { title: 'Dashboard', category: 'MeetingMind' }
  }

  const { title, category } = getPageInfo()

  return (
    <header className="sticky top-0 z-20 h-16 bg-gradient-to-b from-white/95 via-white/88 to-white/82 backdrop-blur-md border-b border-[#648296]/14 shadow-[0_1px_3px_rgba(23,43,58,0.025)] px-4 sm:px-6 flex items-center justify-between gap-4">
      {/* Left: Mobile trigger & Page Title */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobile}
          className="lg:hidden p-2 rounded-lg text-[#5A6E7F] hover:text-[#172B3A] hover:bg-black/[0.04] transition-colors cursor-pointer"
          aria-label="Open navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex flex-col">
          <span className="text-[10px] font-bold text-[#168AAD] uppercase tracking-wider leading-tight">
            {category}
          </span>
          <h1 className="text-base sm:text-lg font-bold text-[#172B3A] tracking-tight leading-tight">
            {title}
          </h1>
        </div>
      </div>

      {/* Middle: Universal Search Bar */}
      <div className="hidden md:flex flex-1 max-w-md mx-4">
        <form onSubmit={handleSearchSubmit} className="relative w-full">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#718096]">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search transcripts, action items, or questions..."
            className="w-full h-9 pl-9 pr-10 rounded-xl bg-white/90 border border-[#648296]/20 text-xs sm:text-sm text-[#172B3A] placeholder-[#718096] shadow-[0_1px_2px_rgba(23,43,58,0.02),inset_0_1px_1.5px_rgba(23,43,58,0.02)] focus:outline-none focus:border-[#168AAD] focus:bg-white focus:ring-2 focus:ring-[#168AAD]/15 transition-all"
          />
          <div className="absolute inset-y-0 right-0 pr-2.5 flex items-center pointer-events-none">
            <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-medium text-[#718096] bg-white border border-[#648296]/20 rounded shadow-xs">
              ⌘K
            </kbd>
          </div>
        </form>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-3">
        <Link
          to="/meetings/new"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-b from-[#1898bd] to-[#147b9b] hover:from-[#199ec5] hover:to-[#126f8c] text-white text-xs font-semibold shadow-[0_1px_2px_rgba(20,123,155,0.25),inset_0_1px_0_0_rgba(255,255,255,0.25)] border border-[#147b9b]/80 transition-all duration-150 active:scale-[0.98]"
        >
          <Plus className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">New Meeting</span>
        </Link>
      </div>
    </header>
  )
}
