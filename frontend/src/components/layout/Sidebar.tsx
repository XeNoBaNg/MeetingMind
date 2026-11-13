import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  Video,
  ListTodo,
  Mail,
  Search,
  Calendar,
  Layers,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Plus,
  Sparkles
} from 'lucide-react'
import { useAuth } from '../../features/auth/AuthContext'
import { formatDisplayName } from '../../utils/userGreeting'

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
}

export function Sidebar({
  collapsed,
  onToggleCollapse,
  mobileOpen,
  onCloseMobile
}: SidebarProps) {
  const location = useLocation()
  const { user, logout } = useAuth()
  const displayName = formatDisplayName(user)

  const navGroups: { group: string; items: NavItem[] }[] = [
    {
      group: 'Workspace',
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
        { label: 'Meeting Search', path: '/search', icon: Search },
        { label: 'Schedule Calendar', path: '/calendar', icon: Calendar },
        { label: 'Integrations', path: '/mcp', icon: Layers }
      ]
    },
    {
      group: 'Account',
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
    <div className="flex flex-col h-full bg-[#EAF2F7] border-r border-[#648296]/16 text-[#172B3A] select-none">
      {/* Brand Header */}
      <div className={`h-16 flex items-center px-4 border-b border-[#648296]/16 ${collapsed ? 'justify-center' : 'justify-between'}`}>
        <Link to="/" onClick={onCloseMobile} className="flex items-center gap-3 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-b from-[#1898bd] to-[#147b9b] text-white flex items-center justify-center shadow-[0_2px_6px_rgba(20,123,155,0.25),inset_0_1px_0_0_rgba(255,255,255,0.3)] group-hover:from-[#199ec5] group-hover:to-[#126f8c] transition-colors">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <span className="font-bold text-base tracking-tight text-[#172B3A] group-hover:text-[#168AAD] transition-colors">
                MeetingMind
              </span>
              <span className="text-[11px] text-[#5A6E7F] font-medium leading-none">
                Meeting Intelligence
              </span>
            </div>
          )}
        </Link>

        {/* Desktop Collapse Toggle */}
        <button
          onClick={onToggleCollapse}
          className="hidden lg:flex p-1.5 rounded-lg text-[#5A6E7F] hover:text-[#172B3A] hover:bg-black/[0.04] transition-colors cursor-pointer"
          title={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          aria-label={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Quick Action Button */}
      <div className={`p-3 ${collapsed ? 'px-2' : ''}`}>
        <Link
          to="/meetings/new"
          onClick={onCloseMobile}
          className={`
            w-full flex items-center justify-center rounded-xl font-medium transition-all duration-150
            bg-gradient-to-b from-[#1898bd] to-[#147b9b] hover:from-[#199ec5] hover:to-[#126f8c] text-white
            shadow-[0_1px_3px_rgba(20,123,155,0.2),inset_0_1px_0_0_rgba(255,255,255,0.25)] border border-[#147b9b]/80 active:scale-[0.98]
            ${collapsed ? 'h-10 p-0' : 'py-2 px-3 gap-2 text-sm'}
          `}
          title="New Meeting"
        >
          <Plus className="w-4 h-4" />
          {!collapsed && <span>New Meeting</span>}
        </Link>
      </div>

      {/* Navigation Links (Scrollable if viewport is small) */}
      <nav className="flex-1 px-2.5 py-2 space-y-5 overflow-y-auto custom-scrollbar">
        {navGroups.map((group, idx) => (
          <div key={idx} className="space-y-1">
            {!collapsed && (
              <div className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-[#718096]">
                {group.group}
              </div>
            )}
            <div className="space-y-0.5">
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
                      relative flex items-center rounded-lg text-sm font-medium transition-all duration-150 group
                      ${collapsed ? 'justify-center h-10 px-0' : 'px-3 py-2 gap-3'}
                      ${
                        active
                          ? 'bg-gradient-to-r from-[#168AAD]/14 to-[#168AAD]/6 text-[#168AAD] font-semibold shadow-[inset_0_1px_0_0_rgba(255,255,255,0.6)]'
                          : 'text-[#5A6E7F] hover:text-[#172B3A] hover:bg-black/[0.04]'
                      }
                    `}
                  >
                    {active && (
                      <span className="absolute left-0 top-1.5 bottom-1.5 w-1 rounded-r-full bg-[#168AAD]" />
                    )}
                    <Icon className={`w-4 h-4 flex-shrink-0 transition-colors ${active ? 'text-[#168AAD]' : 'text-[#5A6E7F] group-hover:text-[#172B3A]'}`} />
                    {!collapsed && (
                      <span className="truncate">{item.label}</span>
                    )}
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* User Card & Logout (Anchored at Bottom) */}
      <div className="p-3 border-t border-[#648296]/16 mt-auto">
        <div className={`
          flex items-center rounded-xl p-2 bg-gradient-to-b from-white/95 to-white/75 border border-[#648296]/16 shadow-[0_1px_3px_rgba(23,43,58,0.03),inset_0_1px_0_0_#ffffff]
          ${collapsed ? 'justify-center' : 'justify-between gap-2.5'}
        `}>
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-[#168AAD]/15 text-[#168AAD] flex items-center justify-center font-bold text-xs flex-shrink-0 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.8)]">
              {displayName.charAt(0).toUpperCase()}
            </div>
            {!collapsed && (
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-[#172B3A] truncate">
                  {displayName}
                </p>
                <p className="text-[11px] text-[#718096] truncate">
                  Account Active
                </p>
              </div>
            )}
          </div>

          <button
            onClick={logout}
            title="Log out"
            aria-label="Log out"
            className="p-1.5 rounded-lg text-[#718096] hover:text-rose-600 hover:bg-rose-50 transition-colors flex-shrink-0 cursor-pointer"
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
          hidden lg:flex flex-col h-screen flex-shrink-0 transition-all duration-200 z-30
          ${collapsed ? 'w-18' : 'w-60'}
        `}
      >
        {sidebarContent}
      </aside>

      {/* Mobile Off-canvas Drawer */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-[#172B3A]/40 backdrop-blur-sm transition-opacity"
            onClick={onCloseMobile}
          />
          <div className="relative w-64 max-w-[80vw] h-full shadow-xl z-10 animate-in slide-in-from-left duration-200">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  )
}
