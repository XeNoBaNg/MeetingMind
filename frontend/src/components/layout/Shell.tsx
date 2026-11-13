import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { TopNav } from './TopNav'

export function Shell() {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="h-screen w-full bg-[#F4F7FA] text-[#172B3A] flex overflow-hidden">
      {/* Sidebar (Desktop and Mobile Drawer) */}
      <Sidebar
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed(!collapsed)}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />

      {/* Main Content Area: Independent Vertical Scroll */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        <TopNav onOpenMobile={() => setMobileOpen(true)} />

        <main className="flex-1 overflow-y-auto min-h-0 p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
