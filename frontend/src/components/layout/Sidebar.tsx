import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  Video,
  ListTodo,
  Mail,
  Sparkles,
  Calendar,
  Cpu,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  BrainCircuit,
  Plus
} from 'lucide-react'
import { useAuth } from '../../features/auth/AuthContext'

interface SidebarProps {
  collapsed: boolean
  onToggleCollapse: () => void
  mobileOpen: boolean
  onCloseMobile: () => void
}

interface NavItem {
  label: string
  path: string
  icon: React.ComponentType<{ className?: string }>
  badge?: string
}

export function Sidebar({
  collapsed,
  onToggleCollapse,
  mobileOpen,
  onCloseMobile
}: SidebarProps) {
  const location = useLocation()
  const { user, logout } = useAuth()

  const navGroups: { group: string; items: NavItem[] }[] = [
    {
      group: 'Overview & Operations',
      items: [
        { label: 'Overview', path: '/', icon: LayoutDashboard },
        { label: 'Meetings', path: '/meetings', icon: Video },
        { label: 'Action Items', path: '/action-items', icon: ListTodo },
        { label: 'Email Drafts', path: '/drafts', icon: Mail }
      ]
    },
    {
      group: 'Intelligence & Tools',
      items: [
        { label: 'Historical Search', path: '/search', icon: Sparkles, badge: 'RAG' },
        { label: 'Calendar Schedule', path: '/calendar', icon: Calendar },
        { label: 'MCP Integrations', path: '/mcp', icon: Cpu, badge: 'v1.0' }
      ]
    },
    {
      group: 'System',
      items: [
        { label: 'Settings', path: '/settings', icon: Settings }
      ]
    }
  ]

  const isItemActive = (path: string) => {
    if (path === '/') return location.pathname === '/'
    return location.pathname.startsWith(path)
  }

  const sidebarContent = (
    <div className="flex flex-col h-full bg-[#081220]/95 backdrop-blur-2xl border-r border-white/[0.08] text-slate-300 relative select-none">
      {/* Brand Header */}
      <div className={`h-20 flex items-center px-5 border-b border-white/[0.08] ${collapsed ? 'justify-center' : 'justify-between'}`}>
        <Link to="/" onClick={onCloseMobile} className="flex items-center gap-3 group">
          <div className="relative w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 via-sky-500 to-blue-600 p-0.5 shadow-lg shadow-cyan-500/20 group-hover:shadow-cyan-500/35 transition-all">
            <div className="w-full h-full bg-[#07101d] rounded-[10px] flex items-center justify-center">
              <BrainCircuit className="w-5 h-5 text-cyan-400 group-hover:scale-110 transition-transform" />
            </div>
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-base tracking-tight text-white group-hover:text-cyan-400 transition-colors">
                  MeetingMind
                </span>
                <span className="px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                  AI
                </span>
              </div>
              <span className="text-[11px] text-slate-400 font-medium">Meeting Intelligence</span>
            </div>
          )}
        </Link>

        {/* Desktop Collapse Toggle */}
        <button
          onClick={onToggleCollapse}
          className="hidden lg:flex p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.08] transition-colors"
          title={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Quick Action Button */}
      <div className={`px-4 pt-4 pb-2 ${collapsed ? 'px-2' : ''}`}>
        <Link
          to="/meetings/new"
          onClick={onCloseMobile}
          className={`
            w-full flex items-center justify-center rounded-xl font-semibold transition-all duration-200
            bg-gradient-to-r from-cyan-500 via-sky-500 to-blue-600 text-white
            shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/35 hover:from-cyan-400 hover:to-blue-500
            border border-cyan-400/30 active:scale-[0.98]
            ${collapsed ? 'h-11 p-0' : 'py-2.5 px-4 gap-2 text-sm'}
          `}
          title="New Meeting Analysis"
        >
          <Plus className="w-4 h-4" />
          {!collapsed && <span>New Analysis</span>}
        </Link>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-4 space-y-6 overflow-y-auto custom-scrollbar">
        {navGroups.map((group, idx) => (
          <div key={idx} className="space-y-1">
            {!collapsed && (
              <div className="px-3 pb-1 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                {group.group}
              </div>
            )}
            <div className="space-y-1">
              {group.items.map((item) => {
                const Icon = item.icon
                const active = isItemActive(item.path)
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={onCloseMobile}
                    title={collapsed ? item.label : undefined}
                    className={`
                      relative flex items-center rounded-xl text-sm font-medium transition-all duration-200 group
                      ${collapsed ? 'justify-center h-11 px-0' : 'px-3.5 py-2.5 gap-3'}
                      ${
                        active
                          ? 'bg-gradient-to-r from-cyan-500/15 via-sky-500/10 to-transparent text-cyan-300 border border-cyan-500/30 shadow-md shadow-cyan-950/20'
                          : 'text-slate-400 hover:text-white hover:bg-white/[0.05] border border-transparent'
                      }
                    `}
                  >
                    {active && (
                      <span className="absolute left-0 top-1.5 bottom-1.5 w-1 rounded-r-full bg-cyan-400 shadow-[0_0_10px_#22d3ee]" />
                    )}
                    <Icon className={`w-5 h-5 flex-shrink-0 transition-colors ${active ? 'text-cyan-400' : 'text-slate-400 group-hover:text-slate-200'}`} />
                    {!collapsed && (
                      <div className="flex-1 flex items-center justify-between min-w-0">
                        <span className="truncate">{item.label}</span>
                        {item.badge && (
                          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-cyan-500/15 text-cyan-400 border border-cyan-500/30">
                            {item.badge}
                          </span>
                        )}
                      </div>
                    )}
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* User Card & Logout */}
      <div className="p-3 border-t border-white/[0.08]">
        <div className={`
          flex items-center rounded-xl p-2.5 bg-white/[0.03] border border-white/[0.06] backdrop-blur-md
          ${collapsed ? 'justify-center' : 'justify-between gap-3'}
        `}>
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white font-bold text-xs shadow-md shadow-cyan-950/40 flex-shrink-0">
              {user?.username?.substring(0, 2).toUpperCase() || 'MM'}
            </div>
            {!collapsed && (
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-white truncate">
                  {user?.username || 'User'}
                </p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <span className="text-[11px] text-slate-400 truncate">Free Plan</span>
                </div>
              </div>
            )}
          </div>

          <button
            onClick={logout}
            title="Log out"
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors flex-shrink-0"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={`
          hidden lg:block flex-shrink-0 transition-all duration-300 z-30
          ${collapsed ? 'w-20' : 'w-64'}
        `}
      >
        <div className="h-screen sticky top-0">
          {sidebarContent}
        </div>
      </aside>

      {/* Mobile Off-canvas Drawer */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-[#040810]/80 backdrop-blur-md transition-opacity duration-300"
            onClick={onCloseMobile}
          />
          <div className="relative w-72 max-w-[80vw] h-full shadow-2xl z-10 animate-in slide-in-from-left duration-300">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  )
}

